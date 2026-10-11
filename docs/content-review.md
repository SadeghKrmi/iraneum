# Content review (step 10)

This review covers all historical content:
- 14 eras with 101 events, their capitals, rulers, territories, 50 border stages and 37 campaign routes;
- 169 world civilizations, 32 of them with border stages;
- the About and Contact pages;
- the mountain names.

It checked dates, places, borders and the Persian texts. Clear errors were fixed. The judgement calls left for
you are listed at the end.

## How it was checked
- **Persian typography (automated):** every Persian string was checked for:
  - Arabic `ي`/`ك` instead of Persian letters;
  - ASCII digits, Latin letters, and `,` `;` `?` instead of Persian punctuation;
  - straight quotes, double spaces, and missing half-spaces (ZWNJ) in `می‌`, `‌ها`, `‌تر`/`‌ترین`.
  - Result: the texts were already clean.
- **Geography (automated):**
  - every capital tested against its territory;
  - every event place tested against the border stage in force at that event;
  - every world capital tested against its territory or stages.
  - Places outside the borders were reviewed one by one. Battles fought abroad (Marathon, Carrhae, Karnal…)
    are expected.
- **Borders (visual):** about 350 outlines were drawn over today's country borders (Natural Earth) and
  inspected panel by panel. Outlines that were clearly wrong were redrawn.
- **Facts and Persian prose (by reading):** every era, event and civilization was read in both languages,
  checking:
  - years and `circa` marks, places, names and attributions;
  - whether the Persian and English say the same thing;
  - Persian wording and standard Persian forms of names.
  - Note: Wikipedia and Encyclopaedia Iranica cannot be reached from this environment. The facts were
    checked against well-established scholarship from memory, not against a live source.

## What changed

### Iranian eras (`content/eras/`)
| Era | Change |
|---|---|
| Achaemenid | Added **Pasargadae**, Cyrus's capital, to the capitals. Persian: «شکست می‌یابد» → «درهم شکسته می‌شود» (Plataea). |
| Seleucid | 141 BCE no longer says the Seleucids lost Iran "for good": it now says their rule ended and a last attempt to win it back failed in 129 BCE (Antiochus VII). |
| Sasanian | "Kalila and Demna" → "Kalila and Dimna". |
| Safavid | Persian: «در محاصره می‌گیرد» → «در محاصره نگه می‌دارد». |
| Afsharid | **Nader's realm in 1736** now includes the South Caucasus, so the Mughan plain where he was crowned lies inside it. **Karim Khan's Zand realm** no longer includes the Caucasus khanates; it stops at the Aras. |
| Qajar | Persian: «نخستین چاه نفت» → «نخستین کشف نفت» (the 1908 find was the first in the Middle East, not the first well). |
| Elam | Persian: «خط آغاز‌ایلامی» (a stray half-space) → «خط ایلامی آغازین». |

**Gregorian years only**, as you asked. Solar Hijri dates in the Persian texts were replaced:

| Event | Before | After |
|---|---|---|
| 1921 coup | «کودتای ۱۲۹۹» | «کودتای ۱۹۲۱» |
| 1953 coup | «کودتای ۲۸ مرداد» | «کودتای ۱۹۵۳» |
| White Revolution | «خرداد ۱۳۴۲» | «ژوئن ۱۹۶۳» |
| 1979 revolution | «انقلاب ۱۳۵۷»، «دی ۱۳۵۷»، «بهمن ۱۳۵۷» | «انقلاب ۱۹۷۹»، «ژانویهٔ ۱۹۷۹»، «فوریهٔ ۱۹۷۹» |

### World civilizations (`content/world/civilizations.json`)
- **Borders redrawn:**
  - **Mongol Empire at its height (1256–60):** it now covers Iran and Iraq after Hulagu's campaign, northern
    China and the Rus' steppe. Before, it stopped at northern Iran.
  - **Song China:** new stage for 1127; after the fall of Kaifeng only the south remains.
  - **Byzantium 641–1204:** new stages for 641 (Anatolia, Thrace, Greece, Sicily, southern Italy), 1018 (to the
    Danube), 1081 (after Manzikert: the Balkans and the Bosporus) and 1180 (Komnenian recovery of western
    Anatolia).
  - **Byzantium 1261–1453:** new stages for 1340 (Thrace, Thessaloniki, part of the Morea) and 1400
    (Constantinople and the Morea).
- **Capitals that fell just outside their rough outlines:** Alexandria (Ptolemaic, Old Kingdom and Late Period
  Egypt), Lisbon, Lima, Buenos Aires.
- **Capitals that changed over time:**

  | Civilization | Capital(s) now shown |
  |---|---|
  | Mughals | Agra, then Delhi |
  | British India | Calcutta, then New Delhi (Delhi only from 1911) |
  | Pakistan | Karachi, then Islamabad |
  | Song | Kaifeng, then Hangzhou |
  | Yamato | Asuka, then Nara |

- **Facts:**
  - Hittites (Persian): the peace treaty came *after* the battle of Kadesh, not "in" it.
  - Ethiopia: "the only African state never colonized" → "with Liberia, one of only two".
  - Poland–Lithuania: "Europe's largest state" → "one of Europe's largest states".
  - Holy Roman Empire (Persian): «هزاران» → «صدها» (hundreds of lands, as in the English).
  - Vijayanagara (Persian): visitors and envoys rather than merchants (e.g. ʿAbd al-Razzaq Samarqandi).
- **Persian forms:**

  | Before | After |
  |---|---|
  | امپراتوری نو آشور / نو بابل | امپراتوری آشور نو / بابل نو |
  | طیبه | تبس |
  | مگده | مگدها |
  | آگرا | آگره |
  | پونا | پونه |
  | کاسپین | دریای خزر |
  | بازگشت میجی | احیای میجی |
  | «… است» (Cahokia) | «… بود» |

### Other content
- **About page:** the world map is no longer described as "coming". A line now says the map's borders are
  simplified and approximate.
- **Contact page (Persian):** «issue» → «گزارش».
- **Mountains (Persian):** «اطلس» → «کوه‌های اطلس», «راکی» → «کوه‌های راکی».
- **Map labels:** Pasargadae sits right next to Persepolis. Its label now gives way when they would overlap.

### Guarding against regressions
`tests/unit/review.test.ts` checks:
- every Persian string (eras, world, pages, mountains, interface) uses Persian letters, digits and punctuation;
- no Persian date uses a solar month with a year;
- every era capital lies inside its era's territory (one listed exception: Samarkand, Timur's capital, outside
  the Ilkhanate's extent);
- every world capital lies inside its territory or one of its stages.

## Judgement calls for you
1. **Elam in Persian.** The era is titled «ایلام», which is also the name of today's Ilam province. Much
   scholarly Persian writes the ancient kingdom «عیلام». Keep «ایلام», or switch to «عیلام»?
2. **The 1953 coup's Persian title.** It is now «کودتای ۱۹۵۳» to keep Gregorian-only dates. Most Iranian
   readers know it as «کودتای ۲۸ مرداد». If you consider that a name rather than a date, it could come back,
   e.g. «کودتای ۱۹۵۳ (۲۸ مرداد)».
3. **Founding date of Media.** The Medes era starts in 678 BCE. Reconstructions from Herodotus give
   Deioces' reign as early as 727 or 708 BCE, and some scholars doubt a unified state before Cyaxares. The date
   is marked *circa*; pick the convention you prefer.
4. **Other uncertain dates, kept with *circa*:**
   - the Burnt City (c. 2800 BCE; the site lived from c. 3200 to 1800 BCE);
   - the Arch of Ctesiphon (c. 540; attributed to Shapur I by some, Khosrow I by others);
   - Qazvin becoming capital (1548 or 1555; shown with the Peace of Amasya in 1555).
5. **What the Caliphate and Mongol eras' maps show.**
   - The Caliphate era's border stages show the Iranian dynasties' realms (Tahirid, Saffarid, Samanid,
     Buyid) rather than the caliphate.
   - The Mongol era's 1219 stage shows the zone the Mongols conquered, rather than a state.
   - Both are deliberate simplifications; tell me if you'd rather show something else.
6. **Modern eras.** The Islamic Republic era names its leaders and runs to 2022. Please check that it is
   current at the time you publish.
7. **Sources and wording on the About page.** The About page says the texts are "written carefully from the
   sources listed on the References page". Those references are general works; individual events are not
   cited. Consider adding sources per event, or softening that sentence. A read-through by a native Persian
   editor and by a historian of each period is still worthwhile before publishing.
8. **Precision of borders.** All outlines are simplified polygons, accurate to roughly 1–2 degrees and drawn
   on land only. Coastlines, deserts (e.g. Egypt's Western Desert) and vassals are shown loosely.
