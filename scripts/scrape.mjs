import fs from 'fs/promises';
import fetch from 'node-fetch';
import { load } from 'cheerio';

const base = 'https://z90.pl/saab/dtc/';
const models = ['9400']; // TODO: add other models
const years = [1998]; // TODO: add other years

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function scrape() {
  const results = [];
  for (const model of models) {
    for (const year of years) {
      const listUrl = `${base}?model=${model}&my=${year}`;
      console.log('Fetching', listUrl);
      const res = await fetch(listUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) { console.error('Failed', res.status); continue; }
      const html = await res.text();
      const $ = load(html);
      $('table.dtc-list tr').each((i, el) => {
        const code = $(el).find('td').eq(0).text().trim();
        const title = $(el).find('td').eq(1).text().trim();
        const system = $(el).find('td').eq(2).text().trim();
        const severity = parseInt($(el).find('td').eq(3).text().trim().replace('G',''));
        const docId = $(el).find('a').attr('href')?.split('doc=')[1];
        if (!code) return;
        results.push({
          dtc: code,
          title,
          system,
          severity,
          model_code: [model, year],
          docId
        });
      });

      for (const item of results.filter(r => r.docId)) {
        await sleep(500);
        const detailUrl = `${base}read.php?model=${model}&doc=${item.docId}`;
        console.log('Detail', detailUrl);
        const resDetail = await fetch(detailUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!resDetail.ok) { console.error('Failed detail', resDetail.status); continue; }
        const detailHtml = await resDetail.text();
        const $d = load(detailHtml);
        item.criteria_activation = $d('#criteria_activation').text().trim();
        item.fault_criteria = $d('#fault_criteria').text().trim();
        item.system_reaction = $d('#system_reaction').text().trim();
        item.harness_checks = $d('#harness_checks').text().trim();
        item.diag_help = $d('#diag_help').text().trim();
        item.oem_procedure_url = detailUrl;
        delete item.docId;
      }
    }
  }
  await fs.writeFile('public/dtc-index.json', JSON.stringify(results, null, 2));
}

scrape().catch(err => {
  console.error(err);
  process.exit(1);
});
