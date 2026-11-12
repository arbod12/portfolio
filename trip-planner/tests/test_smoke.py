"""Smoke-test the zero-build UI in Chromium even if network access is blocked.
Run: python tests/test_smoke.py (requires Playwright + Chromium).
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BROWSER=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')

def create_page(browser,width=1440,height=900):
    page=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
    html=(ROOT/'index.html').read_text()
    html=re.sub(r'<script defer src="https://[^"]+"></script>', '', html)
    html=re.sub(r'<link[^>]*href="https?://[^"]+"[^>]*>', '', html)
    page.set_content(html,wait_until='domcontentloaded')
    page.add_style_tag(content=(ROOT/'styles.css').read_text())
    page.add_script_tag(content=(ROOT/'app.js').read_text())
    page.wait_for_timeout(100)
    return page

def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=BROWSER,args=['--no-sandbox'])
        page=create_page(browser)
        errors=[]
        page.on('dialog', lambda dialog: dialog.accept())
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        assert page.locator('.day-card').count()==5
        assert page.locator('#trip-stops').inner_text()=='12'
        assert page.locator('#planned-total').inner_text()=='$80.00'
        page.locator('[data-action=edit]').first.click()
        page.locator('.stop-editor [data-field=cost]').fill('55')
        page.locator('[data-action=save-stop]').first.click()
        assert page.locator('#planned-total').inner_text()=='$135.00'
        page.locator('#add-custom-btn').click()
        page.locator('#custom-stop-form [name=name]').fill('Tea ceremony')
        page.locator('#custom-stop-form [name=cost]').fill('40')
        page.locator('#custom-stop-form button[type=submit]').click()
        assert page.locator('#trip-stops').inner_text()=='13'
        assert page.locator('#planned-total').inner_text()=='$175.00'
        page.locator('#map-style-control').click()
        assert page.locator('[data-map-style=Dark]').count()==1
        page.locator('#close-modal').click()
        page.locator('#sources-btn').click()
        assert page.locator('.source-link[href]').count()>=20
        page.locator('#close-modal').click()
        page.locator('#help-btn').click()
        assert 'The field manual' in page.locator('#modal-title').inner_text()
        page.locator('#close-modal').click()
        page.locator('#export-btn').click()
        with page.expect_download() as d:
            page.locator('[data-export=json]').click()
        assert d.value.suggested_filename.endswith('.atlas.json')
        page.locator('#smart-plan-btn').click()
        assert page.locator('#trip-stops').inner_text()=='13'
        page.locator('#end-date').fill('2027-04-09')
        page.locator('#end-date').dispatch_event('change')
        assert page.locator('.day-card').count()==2
        assert not errors,errors
        page.close()
        small=create_page(browser,390,820)
        assert small.locator('.mobile-tabbar').is_visible()
        small.locator('[data-tab=itinerary]').click()
        assert small.locator('#right-panel').is_visible()
        small.locator('[data-tab=plan]').click()
        assert small.locator('#left-panel').is_visible()
        small.close(); browser.close()
    print('ATLAS smoke tests passed: stop edits, budget, custom stops, source desk, export, optimization, dates, mobile.')

if __name__=='__main__':main()
