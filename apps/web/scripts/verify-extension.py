"""Rebuild the download twice and check ZIP contents against extension source."""
import io
import pathlib
import subprocess
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[3]
EXTENSION = ROOT / "apps/extension"
DOWNLOAD = pathlib.Path("apps/web/public/downloads/scopebomb-mv3-extension.zip")


def check_archive(data, expected):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)), "Duplicate ZIP entries"
        for name in names:
            path = pathlib.PurePosixPath(name)
            assert name and not path.is_absolute() and ".." not in path.parts and "\\" not in name and ":" not in name, "Unsafe ZIP path"
        assert set(names) == set(expected), "Missing or extra ZIP entries"
        assert archive.testzip() is None, "Invalid ZIP checksum"
        for name in names:
            assert archive.read(name) == expected[name], f"Source mismatch: {name}"


def self_test():
    def zipped(entries):
        output = io.BytesIO()
        with zipfile.ZipFile(output, "w") as archive:
            for name, value in entries:
                archive.writestr(name, value)
        return output.getvalue()

    expected = {"manifest.json": b"{}"}
    check_archive(zipped(list(expected.items())), expected)
    for entries in [[], [("extra", b"")], [("manifest.json", b"wrong")]]:
        try:
            check_archive(zipped(entries), expected)
        except AssertionError:
            continue
        raise AssertionError("Invalid ZIP accepted")
    for name in ["../escape", "/absolute", "a\\b", "C:/escape"]:
        try:
            check_archive(zipped([(name, b"")]), {name: b""})
        except AssertionError:
            continue
        raise AssertionError("Unsafe ZIP accepted")
    print("Archive self-check: valid source accepted; missing, extra, changed and unsafe entries rejected")


def main():
    committed = subprocess.check_output(["git", "show", f"HEAD:{DOWNLOAD.as_posix()}"], cwd=ROOT)
    packs = []
    for _ in range(2):
        subprocess.run(["node", "apps/extension/scripts/pack.mjs"], cwd=ROOT, check=True)
        packs.append((ROOT / DOWNLOAD).read_bytes())
    assert packs[0] == packs[1], "Extension packages are not byte-for-byte reproducible"
    assert packs[0] == committed, "Rebuilt extension differs from committed download"
    files = [EXTENSION / name for name in ["manifest.json", "background.js", "content.js", "guard.html", "guard.js", "popup.html", "popup.js", "shared.js", "styles.css"]]
    files += sorted((EXTENSION / "icons").glob("*.png")) + sorted((EXTENSION / "engine").glob("*.js"))
    expected = {file.relative_to(EXTENSION).as_posix(): file.read_bytes() for file in files}
    check_archive(packs[0], expected)
    print(f"Verified two identical packs, committed download, integrity and {len(expected)} source entries")


if __name__ == "__main__":
    if sys.argv[1:] == ["--self-test"]:
        self_test()
    else:
        main()
