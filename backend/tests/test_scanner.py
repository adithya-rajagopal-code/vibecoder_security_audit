import tempfile
import unittest
from pathlib import Path

from app.main import report, safe_extract, scan_project


class ScannerTests(unittest.TestCase):
    def test_vibeshop_findings_and_report_contract(self):
        fixture = Path(__file__).parent / "fixtures" / "vibeshop"
        findings = scan_project(fixture)
        self.assertEqual([finding["type"] for finding in findings], ["hardcoded_secret", "sql_injection", "potential_idor"])
        result = report(findings)
        self.assertEqual(result["security_score"], 20)
        self.assertEqual(result["summary"], {"total": 3, "critical": 2, "high": 1, "medium": 0, "low": 0})
        for finding in result["findings"]:
            self.assertEqual(set(finding), {"id", "type", "title", "severity", "confidence", "file", "line", "evidence", "code_context", "description", "impact", "recommendation"})
        secret = next(finding for finding in findings if finding["type"] == "hardcoded_secret")
        self.assertNotIn("FAKE_VIBESHOP", secret["evidence"])
        self.assertNotIn("FAKE_VIBESHOP", "\n".join(secret["code_context"]["lines"]))

    def test_zip_slip_is_rejected(self):
        import io
        import zipfile

        data = io.BytesIO()
        with zipfile.ZipFile(data, "w") as archive:
            archive.writestr("../outside.py", "print('no')")
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(Exception):
                safe_extract(data.getvalue(), Path(directory).resolve())


if __name__ == "__main__":
    unittest.main()
