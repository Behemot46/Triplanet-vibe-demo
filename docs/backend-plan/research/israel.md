# Israel regulatory facts for Triplanet (research as of 13 Nov 2026)

Scope: Israeli-founded multi-tenant SaaS for group tour operators. Primary market US, secondary Israel (Hebrew UI). Stores traveller personal data, possibly passport numbers, on behalf of tour operators.

## How to read the labels
- **[verified - URL]** means the cited source states the fact. Most sources are law-firm or vendor secondaries. Where I could read the statute itself, the source is the non-formal English translation of Amendment 13 published by EBN Law (Sep 2024): https://ebnlaw.co.il/wp-content/uploads/2024/09/Amendment-13-Israeli-Privacy-Law-non-formal-translation.docx. It is cited below as **[verified - EBN translation]**. It is a translation, not the official Hebrew text in Reshumot or Nevo.
- **[unverified]** means I did not find a source that states it, or the sources conflict.
- **[analysis]** means my own reading for Triplanet. It is not legal advice.
- gov.il pages returned HTTP 403 to automated fetches. gov.il URLs are cited from search results, and I could not read them myself unless noted.

---

## 1. Privacy Protection Law 5741-1981, Amendment 13

### Status and dates
- Approved by the Knesset on 5 Aug 2024 and in force since 14 Aug 2025. [verified - https://iapp.org/news/a/israel-marks-a-new-era-in-privacy-law-amendment-13-ushers-in-sweeping-reform (13 Aug 2025); https://www.dlapiperdataprotection.com/?c=IL (modified 25 Dec 2024)]
  - An early Meitar memo of 7 Aug 2024 says 6 Aug 2025. Later sources all say 14 Aug 2025. [verified - https://meitar.com/wp-content/uploads/2024/09/Amendment-13-to-the-Privacy-Protection-Law-Approved-by-the-Knesset-Major-Points-of-the-Amendment-and-Its-Implications.pdf]
- The Privacy Protection Authority (PPA, הרשות להגנת הפרטיות) now acts under statutory powers: inspectors, administrative fines, cease orders and pre-rulings. [verified - Meitar memo above; EBN translation, sections 23i onward]
- **Changed in 2026:**
  - The first fines under Amendment 13 have been imposed (see Fines below).
  - The PPA published its final DPO position paper in about mid-July 2026. [verified - https://barlaw.co.il/practice_areas/regulation/privacy-law/client_updates/position-statement-on-the-obligation-to-appoint-a-dpo-not-a-change-in-the-law-but-a-change-in-the-rules-of-the-game/ (22 Jul 2026)]
  - The PPA published a position paper on Reg 2(4) of the transfer regulations on 13 Apr 2026 (see section 3).
  - A consent and notice opinion followed in Feb 2026. [verified - https://www.melnik.org.il/en/privacy-notice-consent-israel-en/ (title only)]
  - Fine amounts are CPI-indexed every 1 January. The first update was in 2026. [verified - EBN translation, s.23 indexation clause]

### Controller vs holder (processor)
- **"Controller" (בעל שליטה) of a database:** "One who determines, alone or together with another, the purposes of processing the information in the database". [verified - EBN translation, s.3 definitions]
- **"Holder" (מחזיק):** "An external entity to the controller of the database that processes information for them". [verified - EBN translation]
  - [analysis] Each tour operator tenant is the controller. Triplanet is the holder.
- **A holder has direct duties.** [verified - EBN translation]
  - **Security fines:** a "database controller or database holder" who breaches the Data Security Regulations can be fined directly under s.23ko(h) and the Third Schedule.
  - **Controller is notified:** when a holder is fined, the PPA notifies the controller and orders it to stop the holder's violation. If the controller does not act, the controller can be fined the same amount (s.23ko(j)).
  - **Other direct fines:** a holder can be fined for unauthorized processing, for exceeding the controller's authorization (s.8(c), 4 or 8 NIS per data subject with a NIS 200,000 floor), and for not giving documents to an inspector (NIS 300,000).
  - **Many tenants:** s.17A says a holder of databases of different owners must ensure that access to each database is granted only to those expressly authorized by written agreement with that owner. [analysis] This maps directly to tenant isolation.
  - **Annual list:** s.17A(b) requires a holder of at least 5 databases that must be registered to file an annual list. [analysis] This probably does not bite, because registration is now narrow.
- Section 17 of the law makes the owner, holder and manager each responsible for information security. [verified - law-firm paraphrase in search results; Knesset consolidated text https://fs.knesset.gov.il/25/law/25_ls_bk_4300009.pdf not read]
- The PPA view, in its 13 Apr 2026 paper, is that a foreign holder, for example a US cloud provider, is directly subject to the Israeli law even without an Israeli presence. [verified - https://www.gornitzky.com/cross-border-data-transfer-agreements-the-position-of-the-israeli-privacy-protection-authority-2/ (26 Apr 2026)]

### "Information of special sensitivity" (מידע בעל רגישות מיוחדת)
This new term replaces "sensitive information". [verified - EBN translation]

The list:
1. Family privacy, personal intimacy and sexual orientation.
2. Health condition, including medical information as defined in the Patient Rights Act.
3. Genetic information.
4. A biometric identifier used or intended to be used for computerized identification.
5. A person's origin.
6. Criminal history.
7. Political opinions, religious beliefs or worldview.
8. A personality assessment.
9. Location and traffic data created by a communications provider, and location data that can reveal items 1-7 or 11.
10. Salary data and financial activity.
11. Information subject to a statutory duty of confidentiality.
12. Other data that the Minister adds in the Second Schedule. This covers data transferred into Israel from abroad that has special status at its origin.

[analysis] What this means for Triplanet:
- A passport number is not itself on the list.
- Group-tour data often includes medical or accessibility needs (item 2) and dietary or religious requirements such as kosher, halal or Shabbat (item 7). Nationality and birthplace may count as "origin" (item 5); that point is unverified.
- Payment history may count as "financial activity" (item 10).
- Any of these makes a tenant database "especially sensitive". That raises its security level (section 2) and its fine multipliers.

### Registration duty (narrowed)
Only two kinds of database must still register [verified - EBN translation, s.8A(a); DLA Piper; Meitar]:
- a database whose main purpose is collecting personal data for transfer to others as a business or for consideration, including direct-mailing services, with data on more than 10,000 individuals;
- a database whose controller is a public body (with exceptions, such as employee-only databases).

All other databases no longer register. [verified - gov.il registration page summary in search results, https://www.gov.il/he/service/registration_in_the_database]

### Notification duty
A database that does not have to register but holds information of special sensitivity on more than 100,000 individuals must be notified to the PPA by its **controller**. [verified - EBN translation, s.8A(b)(1)]
- The notice is due within 30 days of crossing the threshold.
- It must give the controller's identity, address and contacts, and the DPO's identity.
- Changes must be notified within 30 days.
- The fine for breaching it is NIS 150,000, doubled at 1,000,000 or more data subjects (s.23ko(a)).
- DLA Piper prints the threshold as "100,0000", a typo. [verified - DLA Piper]
- [analysis] The duty falls on each tenant controller, not on Triplanet, and it is per database. A single Israeli tour operator rarely reaches 100k especially sensitive records.

### DPO (Privacy Protection Officer, ממונה הגנת פרטיות), s.17B1
These entities must appoint one [verified - EBN translation]:
1. A controller of a public-body database, or a holder of one.
2. A controller of a data-trading or direct-mail database with more than 10,000 people.
3. A controller **or holder** whose main occupations include processing that requires ongoing and systematic monitoring of persons on a significant scale.
4. A controller **or holder** whose main business includes processing especially sensitive information on a significant scale. Examples given: banks, insurers, hospitals, health funds.

Other rules:
- "Significant scale" is judged by number of individuals, share of the population, volume and range of data types, duration and frequency, retention period and geography. There is no numeric threshold. [verified - EBN translation s.17B1(b); Barnea 22 Jul 2026]
- The DPO reports to the CEO or to someone who reports to the CEO, may be external, and must have no conflict of interest. [verified - EBN translation]
- The PPA final position (about mid-July 2026) says a holder such as a cloud, SaaS or outsourcing provider must assess the DPO duty **cumulatively across all its clients**. Many small tenant databases can add up to large scale. [verified - https://barlaw.co.il/practice_areas/regulation/privacy-law/client_updates/position-statement-on-the-obligation-to-appoint-a-dpo-not-a-change-in-the-law-but-a-change-in-the-rules-of-the-game/ (22 Jul 2026)]
  - [analysis] If Triplanet aggregates health or dietary data on many travellers, it should plan to appoint a DPO, at least an external one.
- The separate Information Security Officer duty (s.17B) still applies to public bodies, banks and insurers, and to anyone controlling or holding 5 databases that must register or notify. [verified - EBN translation]

### Administrative fines
Source: EBN translation, s.23ko and the Third to Fifth Schedules. Amounts are as enacted, before the CPI update of Jan 2026. Secondary confirmation: https://www.inplp.com/publications/israel-s-first-administrative-fines-under-amendment-13-a-new-enforcement-era-for-privacy-c (8 Oct 2026).

| Breach | Amount |
|---|---|
| Registration or notification breaches | NIS 150,000; doubled at 1M+ data subjects |
| Access, correction and deletion rights | NIS 15,000 |
| Notice duty (s.11) | NIS 50 per individual approached, NIS 100 for special sensitivity; floor NIS 20,000 / 40,000 |
| Unlawful-purpose processing; processing without or beyond the controller's authorization | NIS 4 per data subject, NIS 8 for special sensitivity; floor NIS 200,000 |
| Refusing documents to an inspector | NIS 300,000 |

Data Security Regulations fines (Third Schedule), per item, by security level:

| Level | Amounts |
|---|---|
| Individual-managed | NIS 1,000-2,000 |
| Basic | NIS 1,000-4,000 |
| Medium | NIS 20,000 / 40,000 / 80,000 |
| High | NIS 80,000 / 160,000 / 320,000 |

- Examples at high level: risk survey not done, NIS 320,000; penetration tests not done, NIS 320,000; outsourcing control (Reg 15), NIS 160,000.
- Doubled for a high-level database with 1M+ data subjects.

Caps (Fifth Schedule):
- **Micro business** (turnover up to NIS 4M): NIS 20,000 / 50,000 / 70,000, depending on the violation group.
- **Small business** (NIS 4-10M): NIS 40,000 / 100,000 / 140,000.
- **Overall cap:** 5% of the violator's turnover.
- Reductions on request may not exceed 70% in aggregate. [verified - inplp]

Enforcement so far [verified - inplp, 8 Oct 2026]:
- **Meuhedet health fund:** NIS 256,000 (Jul 2026), for late reporting of a severe security incident under Reg 11(d).
- **A.D Karting:** NIS 12,000 (Aug 2026), for a notice-duty breach.
- **Beit Shemesh Municipality:** NIS 64,000 (Sep 2026). It failed to identify a supplier as a holder under Reg 2(a)(7), and its outsourcing procedure did not cover Reg 15(a)(3).
- [analysis] Outsourcing and holder contracts are an active enforcement target.

---

## 2. Privacy Protection (Data Security) Regulations 5777-2017

- In force since 8 May 2018. [verified - https://www.law.co.il/en/articles/2017/03/26/dramatic-overhaul-israeli-data-security-regulations/]
- They still apply after Amendment 13; Amendment 13 attached fines to them. No 2025-2026 amendment to the regulations was found. [unverified that none exists]

### Security levels
The definitions below come from Amendment 13's Third Schedule, which ties fines to the levels. [verified - EBN translation, Third Schedule definitions]

**Individual-managed:**
- Controller is an individual, or a company owned by one or two individuals.
- At most 2 additional authorized users.
- Excluded: data-trading databases, databases with 10,000+ individuals, and databases under professional confidentiality.

**Basic:** not individual-managed, and all of the following:
- not a data-trading database;
- controller is not a public body;
- if it holds information of special sensitivity, either (a) the controller has no more than 10 authorized users, or (b) the sensitive data is only about employees or suppliers, of limited types.

**Medium:** not high, and one of the following:
- a data-trading database;
- a public-body controller;
- it contains information of special sensitivity, other than the basic-level exceptions.

**High:**
- a data-trading database, or a database with information of special sensitivity, where the controller has more than 100 authorized users or the database holds 100,000+ individuals; or
- a database with biometric identifiers of 100,000+ individuals.

The 2017 commentary describes the same structure: high = 100,000+ data subjects or more than 100 authorized users. [verified - law.co.il 2017; https://iapp.org/news/a/israel-enacts-landmark-data-security-notification-regulations]

[analysis] Where a Triplanet tenant would sit:
- A tenant with sensitive traveller data and more than 10 users is **medium**.
- An Israeli operator with 100,000+ travellers with sensitive data, or more than 100 users, is **high**.
- Holders must apply the regulations "mutatis mutandis" (Reg 19(a)). The fines schedule repeatedly names "controller or processor".
- Building to high-level controls is the safe default for the platform.

### Obligations by level
Sources: law.co.il 2017; https://protocol.co.il/protection-of-privacy-regulations-information-security/; EBN translation, Third Schedule.

**All levels except individual-managed:**
- A database definition document (Reg 2), reviewed for excess data.
- A written security procedure (Reg 4). It must include incident handling and reporting to the controller (Reg 11(b)).
- A structure and inventory document (Reg 5(a)).
- Physical security and access control.
- Training before access is granted.
- Documentation of every security incident (Reg 11(a)).
- Patching, and no unsupported systems.
- Internet connection protections (Reg 14).
- Segregation of database systems from other systems (Reg 13(b)).
- Backup of documentation data.
- Outsourcing controls (Reg 15).

**Medium and high:**
- An internal or external audit at least once every 24 months (Reg 16). [verified - EBN Third Schedule item 29; protocol.co.il]
- An automatic access log (Reg 10) kept for at least 24 months. [verified - protocol.co.il ("24 חודשים לפחות"); law.co.il ("at least two years")]
  - Conflict: the EBN translation of Third Schedule item 25 says documentation under Reg 17(a) must be kept "for at least one year". [unverified which retention applies to which record; check the Hebrew text]
- Periodic review of security incidents: annual for medium, quarterly for high. [verified - law.co.il]
- A backup and recovery plan. [verified - law.co.il]

**High only:**
- A risk survey at least once every 18 months (Reg 5(c)). [verified - EBN Third Schedule]
- Penetration tests at least once every 18 months (Reg 5(d)). [verified - EBN Third Schedule]

### Incident reporting
- Report a **severe security incident** to the PPA **immediately**, and then report the steps taken (Reg 11(d)(1)). [verified - EBN Third Schedule item 21; inplp on Meuhedet: "close to discovery and without delay"]
- What counts as severe:
  - **Medium level:** unauthorized use of, or damage to, a material part of the database.
  - **High level:** any part of the database.
  - [verified - law.co.il; protocol.co.il]
- The PPA may order notice to data subjects. [verified - DLA Piper]
- Since 7 Aug 2022 the PPA has asked for immediate reports even on suspicion of a severe incident. [verified - DLA Piper]
- A holder's security procedure must cover reporting incidents to the controller (Reg 11(b)). [verified - EBN Third Schedule item 5]
- A fixed "72 hours" appears only in vendor blogs. [unverified]

### Outsourcing and holder contracts (Reg 15)
**Before engaging:** assess the security risks of the engagement. [verified - law.co.il]

**The written agreement must cover** [verified - https://protocol.co.il/protection-of-privacy-regulations-information-security/; law.co.il; https://www.barlaw.co.il/wp-content/uploads/2020/02/011_ISRAEL-LP.pdf]:
- what data the holder may process, and for what purposes;
- which systems it may access;
- what types of processing are allowed;
- the duration, and return or deletion of the data at the end;
- how the security obligations are implemented;
- a confidentiality undertaking by the holder and its users;
- incident reporting to the controller;
- at least an annual compliance report;
- the same terms for any sub-processor.

**Other Reg 15 duties:**
- The controller must add the Reg 15 matters to its own security procedure (Reg 15(a)(3)).
- The controller must supervise the holder (Reg 15(a)(4)). Breach of this costs NIS 160,000 at high level. [verified - EBN Third Schedule item 24]
- The PPA reads "external entity" in Reg 15 more broadly than "holder": anyone with actual access counts. [verified - search summary of https://www.dataguidance.com/news/israel-ppa-clarifies-difference-between-third-party]
- The PPA published a Reg 15 implementation guide in Sep 2023. [verified - https://ayr.co.il/מדריך-פעולה-ליישום-תקנה-15-לתקנות-אבטחת (19 Sep 2023)]

[analysis] Triplanet should ship a standard Israeli DPA (Reg 15 + Reg 2(4)/3 transfer terms) for Israeli tenants. It should also give tenants evidence to support their supervision duty, such as an annual compliance statement, audit or pen-test summaries, and ISO 27001 if obtained.

---

## 3. Transfer of data abroad

### 2001 Transfer Regulations
- Privacy Protection (Transfer of Data to Databases Abroad) Regulations 5761-2001.
- A transfer is prohibited unless the destination law gives protection no lower than Israeli law, or one of the Reg 2 conditions applies. [verified - DLA Piper; https://www.gornitzky.com/cross-border-data-transfer-agreements-the-position-of-the-israeli-privacy-protection-authority-2/]
- Conditions include:
  - consent;
  - **Reg 2(4):** the recipient undertakes by agreement to comply with Israeli conditions for holding and using the data, mutatis mutandis;
  - legal requirement;
  - EU or Convention-country routes. Transfer to the EU needs no other condition. [verified - Baker McKenzie summary in search results]
- Reg 3 also requires a written undertaking that the recipient secures the data and makes no onward transfer. [verified - DLA Piper]
- The PPA relaxed the onward-transfer rule in 2022, mainly allowing it with the exporter's consent. [verified - https://www.goodwinlaw.com/en/insights/blogs/2022/01/israels-privacy-regulator-relaxes-onward-transfers-restriction]

**Reg 2(4) position paper of 13 Apr 2026** [verified - Gornitzky 26 Apr 2026; PDF at https://www.gov.il/BlobFolder/publicsharing/regulation_2_4/he/regulation%202%284%29.pdf (not read)]:
- The recipient must commit to obligations "identical to, or at least materially similar in substance to" the Israeli law: purpose limitation, access, correction and deletion, confidentiality.
- For security, the recipient either commits to the material Data Security Regulations obligations, or declares ISO/IEC 27001 certification plus Registrar Guideline 3/2018.
- EEA-origin data also needs the 2023 EEA rules.
- SaaS agreements should be reviewed.

**US and the EU-US Data Privacy Framework:**
- After Schrems II (2020) the PPA said Privacy Shield is not a basis for US transfers. [verified - Baker McKenzie summary in search results]
- As of the Jan 2025 Baker McKenzie review, the PPA had not opined on the EU-US Data Privacy Framework. [verified - same]
- I found no later PPA statement on the DPF. [unverified]

**Can Israeli tenants' data be hosted in AWS US?**
- Nothing found prohibits it, and there is no Israeli data-localization rule for private-sector controllers. [unverified as a negative]
- The route used in practice is Reg 2(4) and Reg 3: an AWS DPA plus Triplanet's own DPA that binds to Israeli-law-equivalent terms, or the ISO 27001 option, plus an onward-transfer undertaking. [analysis based on the Apr 2026 PPA paper]
- AWS, as Triplanet's sub-processor, is itself directly subject to Israeli law in the PPA's view. [verified - Gornitzky]
- Sector regulators may add their own limits on cloud abroad. Example: the Bank of Israel cloud directive for banks. That is not relevant to tour operators. [verified - search result https://www.boi.org.il/media/r2kmthr3/201514en.pdf exists; content not read]

### 2023 EEA Regulations
- Privacy Protection Regulations (Provisions regarding Information Transferred to Israel from the European Economic Area), 2023; Hebrew year 5783.
- Scope: Israeli databases holding personal data transferred from the EEA. Data the data subject provided directly about himself is excluded. [verified - https://www.pearlcohen.com/new-privacy-regulations-in-israel-govern-data-transfers-from-the-eea/ and search summary]
- They add deletion, accuracy, notice and onward-transfer duties.
- **Changed from 1 Jan 2025:** the rules also apply to non-EEA data stored in the same database as EEA-origin data. [verified - search summary of Pearl Cohen / Gornitzky]
- Breaches carry fines of NIS 2 or 4 per data subject. [verified - inplp; EBN Fourth Schedule]
- [analysis] This is relevant only if tenants import traveller data received from EEA partners, for example EU ground handlers. Data that EU travellers give directly to the operator is excluded.
- Israel's EU adequacy was reconfirmed by the European Commission on 15 Jan 2024. [verified - DLA Piper]

---

## 4. Israel Tax Authority allocation numbers (חשבוניות ישראל / מספר הקצאה)

### Threshold schedule (amount before VAT)
- **May 2024:** NIS 25,000. [verified - search summaries citing ITA; https://www.gov.il/he/service/request-assignment-number-for-tax-invoice]
- **2025:** NIS 20,000. [verified - https://kpmg.com/us/en/taxnewsflash/news/2025/12/tnf-israel-expansion-of-mandatory-e-invoicing-model.html (12 Dec 2025)]
- **1 Jan 2026:** NIS 10,000. [verified - KPMG; https://herzoglaw.co.il/en/?p=73487 (11 Jan 2026)]
- **1 Jun 2026:** NIS 5,000. [verified - KPMG; Herzog; Bizportal reporting ITA statements]
  - The ITA published the regulation on 7 Dec 2025. [verified - KPMG]
  - The 2025 budget law moved this up. The older calendar of NIS 10,000 in 2027 and NIS 5,000 in 2028 is superseded. [verified - search summaries of capitax / h-erp]
- **CURRENT as of Nov 2026: NIS 5,000 before VAT.**
  - As of Oct 2026, no step below NIS 5,000 had been legislated. [verified - vendor and adviser guides in search results, e.g. https://horizon.org.il/cfo-outsource/allocation-number-invoice-2026/; not an ITA primary source]
  - Example from a vendor source: a NIS 4,900 invoice needs no number even though VAT takes the total above 5,000. [verified - vendor source only]

### Scope and consequences
- Applies to B2B tax invoices where the customer is a VAT-registered dealer. [verified - KPMG; adviser guides]
- No number on an above-threshold invoice means the **buyer cannot deduct input VAT** (VAT Law s.38(a1)). [verified - Herzog]
- The ITA reviews requests in real time and may refuse. The dealer's options then are: cancel; issue without a number; reverse charge; or a hearing, then an objection, then an appeal. [verified - https://www.efraty.com/?p=5293]
- **VAT consolidation groups:** a consolidated group may issue one monthly invoice with a single number until 1 Jul 2027. After that each invoice between members needs its own request. [verified - search summary; not confirmed against an ITA notice]
  - Another source reports an ITA notice of 27 May 2026 on intra-group requests. [unverified]

### Who requests, and API access
- The **issuing dealer (supplier)** requests the number. The dealer registers for ITA digital services and authorizes personnel. [verified - KPMG; efraty]
- **Software flow:**
  - The business owner logs in through the government identity service and approves a permission for the invoicing software. The software then holds a token and requests numbers automatically. [verified - https://www.greeninvoice.co.il/magazine/קבלת-טוקן-חשבוניות-ישראל/ (vendor)]
  - [analysis] Triplanet would act as the software. Each Israeli tenant would authorize it.
- **ITA OpenAPI:**
  - All services use OAuth2 "User Restricted", meaning the user authorizes the app.
  - Production host: openapi.taxes.gov.il/shaam/production/...
  - Sandbox host: ita-api.taxes.gov.il/shaam/tsandbox/...
  - Developer portal and user guide: http://secapp.taxes.gov.il/OpenApiUserGuide/OpenApiUserGuide.pdf (returned 503 on fetch).
  - Support: APISupport@taxes.gov.il.
  - [verified - ITA software-house API PDF (Donations model, ed. 4.0, 12.2025), https://www.gov.il/BlobFolder/generalpage/hor-software-other/he/IncomeTax_IncomeTaxSoftwareHousesInfo_software-houses-181225-1.pdf, which shares the platform and error tables referencing "shaam_tsandbox_invoices_v1"]
  - A Dec 2023 ITA notice said invoice endpoints moved to ita-api.taxes.gov.il while /authorize stayed on openapi.taxes.gov.il. [verified - search summary of https://www.caspit.biz/?p=4779]
- **Connecting to SHAAM (שע"ם) as a software house:** there is a gov.il service, "קישור לשע"ם – מייצגים, כספות ובתי תוכנה". It requires a connection procedure, a letter of commitment for API use, an information-security appendix, and developer-portal work procedures. [verified - search summary of https://www.gov.il/he/service/connect-to-shaam (page not read)]
- The exact invoice-approval API spec ("Israel Invoice Model Description of API's") was not retrieved. [unverified]

### Software registration (רישום תוכנה)
- Income Tax (Bookkeeping) Directives (הוראות מס הכנסה (ניהול פנקסי חשבונות), 1973), under s.36 of the Income Tax Ordinance.
- **Who must register:** makers of accounting software that is sold, leased or made available to third parties, including free use. [verified - https://www.gov.il/en/service/registration-software-designed-managing-computerized-accounting-system (summary)]
  - Software developed in-house by the business's own employees is exempt. [verified - search summary of https://www.gov.il/he/service/itc-software-registry-for-computerized-accounting-systems]
- **Uniform file module:** the software must include a module that produces the "uniform format" file (מבנה אחיד). [verified - same gov.il service summary]
- Registration is free. The certificate is issued by the ITA Computerized Audit unit under the Appendix to the Directives. It has a validity period and does not certify correctness. [verified - sample certificate https://www.h-erp.co.il/wp-content/uploads/2022/04/תעודת-רישום1.pdf]
  - Sources disagree on which appendix: one says Appendix E (נספח ה). The caller's brief said "appendix H", which is not confirmed. [unverified]
- The ITA API documents carry an "Accounting_software_number" (the software registration number) field. [verified - ITA donations API PDF above]
  - [analysis] The invoices API likely expects it too. [unverified]
- A business using a computerized system must use registered software. [verified - gov.il registry page summary: "under the bookkeeping regulations, software of this type generally must be registered"]
  - [analysis] A SaaS that issues Israeli tax invoices for tenants is "computerized accounting software made available to third parties". It needs ITA registration, a uniform-file export, and retention and auditability features.

---

## 5. Tax invoice requirements and VAT on tourism

### חשבונית מס (VAT Law s.47; VAT regulations)
Mandatory content [verified - https://protocol.co.il/tax-invoice/; https://www.bshcpa.co.il/חשבונית-מס/; efraty s.47 summary]:
- the heading "חשבונית מס";
- the supplier's name, address, "עוסק מורשה" status and number;
- a serial number;
- the date;
- the customer's name, address and registration number, with Director exceptions;
- a description of goods or services, with quantity and unit;
- the price;
- VAT shown separately under "מס ערך מוסף";
- the total.

Above the threshold, add the 9-digit allocation number. [verified - KPMG; vendor sources]

Other points:
- **חשבונית מס קבלה** (combined invoice and receipt) is a recognized document type. [verified - https://www.kolzchut.org.il/he/הוצאת_חשבונית_מס,_חשבונית_עסקה_וקבלה (title)]
- **Digital invoices:** sources conflict on whether an electronic or digital signature is required. [unverified]
- **Retention:** 7 years from the end of the tax year, or 6 years from filing the return, whichever is later. [verified - 2017 guide https://israeldesks.com/books/doing_business_in_israel_2017/files/assets/basic-html/page-42.html]
- **VAT rate:** 18% since 1 Jan 2025, up from 17%. [verified - multiple 2026 guides, e.g. https://herzoglaw.co.il/en/?p=65575] **Changed in 2025.**

### VAT on incoming tourism: s.30(a)(8)
- s.30(a)(8) gives 0% VAT on listed services to a tourist. Examples: hotel lodging, car hire, tourist transport (30(a)(8)(b)(2)), hospitalization, and travel-agency services as defined in the Tourism Services Law (30(a)(8)(b1)). The last includes organizing and selling tours of Israel and booking hotel lodging. [verified - search summaries of capitax / bizportal articles]
- It is a closed list in the ITA view, and courts read it narrowly. [verified - bizportal commentary summary]
- **Repeal attempts:**
  - Proposed in Nov 2024 for the 2025 plan; dropped after the government approved the budget. [verified - ias.co.il summary]
  - Proposed again on 21 Nov 2025 for the 2026 economic plan. [verified - capitax / britcpa summaries]
  - News reports say the repeal was removed or postponed "at the very last moment" and was not in the Arrangements Law passed in late March 2026. [verified only by secondary news summaries: israelnationalnews / hidabroot in search results; not confirmed against the enacted law]
  - [unverified] Treat s.30(a)(8) as **still in force as of Nov 2026**, but confirm with an Israeli VAT adviser. It is a recurring repeal target, and a Ynet item from May 2026 mentions a separate Eilat VAT exemption proposal.
- [analysis] This matters for an Israeli incoming operator selling to US groups. Lines for tourists (foreign residents, as defined) are 0%. Triplanet invoices need per-line VAT treatment (18% or 0% with the legal basis). A 0% invoice above NIS 5,000 to a non-dealer foreign client does not need an allocation number, because that requirement is B2B to Israeli dealers. [analysis; unverified]

---

## 6. AWS Israel (Tel Aviv), il-central-1

- Launched 1 Aug 2023 with 3 Availability Zones. [verified - https://aws.amazon.com/blogs/aws/now-open-aws-israel-tel-aviv-region]
- **Services listed at launch** [verified - same blog]:
  - Containers: ECS, EKS, ECR, Fargate.
  - Databases: Aurora, Aurora PostgreSQL, RDS, DynamoDB, ElastiCache, Redshift.
  - Storage: S3, EBS.
  - Security and networking: KMS, Secrets Manager, IAM, WAF, Shield, CloudFront, Route 53, API Gateway.
  - Compute and messaging: Lambda, SQS, SNS, Step Functions, EventBridge.
  - Management: CloudWatch, CloudTrail, Config.
- RDS for PostgreSQL M6i, R6i, M6g, R6g and T4g instances in Tel Aviv were announced in Jul 2024. [verified - https://aws.amazon.com/about-aws/whats-new/2024/07/amazon-rds-m6i-r6i-m6g-r6g-t4g-instances-israel]
- **Bedrock and Claude:**
  - The Claude in Amazon Bedrock docs list il-central-1 with **"Global" endpoint type only**. There is no regional or in-region option for Israel. [verified - https://platform.claude.com/docs/en/build-with-claude/claude-in-amazon-bedrock (fetched Nov 2026)]
  - [analysis] Calls from Tel Aviv route dynamically to other regions, so inference data leaves Israel. Treat it as a transfer abroad (Reg 2(4)/3 terms through the AWS DPA), the same as the direct Claude API.
  - The AWS docs show il-central-1 supported for bedrock-runtime. [verified - search summary of https://docs.aws.amazon.com/bedrock/latest/userguide/endpoints-region-availability.html]
- SES, Cognito and Textract in il-central-1 were not confirmed. [unverified; check https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/]

---

## What changed in 2025-2026 (summary)
1. Amendment 13 in force since 14 Aug 2025. It brought controller and holder terms, especially sensitive information, narrow registration, the >100k notification duty, DPOs, and administrative fines, including fines directly on holders.
2. 2026 enforcement:
   - first fines from Jul to Sep 2026, including one for outsourcing and holder failures;
   - final DPO position (about Jul 2026), with the SaaS holder test applied across all clients;
   - Reg 2(4) transfer position paper (13 Apr 2026);
   - CPI indexation of fines from Jan 2026.
3. EEA regulations extended to mixed databases from 1 Jan 2025.
4. VAT at 18% since 1 Jan 2025.
5. Allocation-number threshold: NIS 20,000 (2025), NIS 10,000 (Jan 2026), **NIS 5,000 (1 Jun 2026, current)**. Consolidated-group change by 1 Jul 2027.
6. The s.30(a)(8) tourism zero rate survived repeal attempts for 2025 and 2026 (secondary sources).

## Open items to confirm with Israeli counsel or an accountant
- The official Hebrew text of the Amendment 13 schedules and the 2026 CPI-updated amounts.
- Record retention: 24 months vs 1 year (Reg 10 vs Reg 17).
- Whether Israeli law reaches Triplanet as an Israeli holder of **US** controllers' data. The territorial reach of the law over a non-Israeli controller's database is not addressed in my sources. [unverified]
- PPA view on the DPF for US transfers.
- The ITA invoices API spec, software-house onboarding steps, and the registration appendix letter.
- Whether s.30(a)(8) is in force, against the enacted 2026 Arrangements Law.
- Digital-signature rules for e-invoices.
