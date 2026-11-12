/* ---------- English translation layer ---------- */
const DICT={
'אדינבורו':'Edinburgh','אושר':'Confirmed','אושרה, טרם שולמה':'Approved, not yet paid','אחוז מקדמה':'Deposit percent','אחראי':'Owner','אחראי תיק':'File owner',
'איחור':'Late','איחורים בתשלומי לקוחות':'Late customer payments','איך מתחלקות העלויות המשותפות':'How shared costs are split',
'אין אתרים. גררו לכאן או הוסיפו':'No sites yet. Drag one here or add one','אין התראות':'No alerts','אין התראות כספיות':'No financial alerts','אין חשבונית':'No invoice',
'אין טיולים שהוזמנו בסינון הזה':'No booked trips match this filter','אין כאן טיולים':'No trips here','אין מחיר בקובץ. יש לשאול את הספק.':'No price in the file. Ask the supplier.',
'אין מענה':'No reply','אין משימות באיחור':'No overdue tasks','אין תבניות':'No templates','אין תוצאות':'No results',
'אישור ההצעה יוצר קבוצות חיוב, רשימת משימות ואישורי ספקים':'Accepting the quote creates billing groups, a task list and supplier confirmations','אישור הצעה':'Quote approval','אישורי ספקים':'Supplier confirmations',
'אלה מההנהלה':'Ella M.','אלה מההנהלה (מנהלת':'Ella M. (manager','אלרגיה לאגוזים':'Nut allergy',
'אם המטבעות שאתם חייבים לספקים יתחזקו או יחלשו מול הדולר לפני התשלום, זו ההשפעה על הרווח הצפוי':'If the currencies you owe suppliers strengthen or weaken against the dollar before you pay, this is the effect on expected profit',
'אמסטרדם':'Amsterdam','אני עונה מהנתונים שבדמו. נסו: פערי חשבוניות, טיולים מתחת לקו שולי הרווח, מי מאחר בתשלום, תזרים בשלושה חודשים, חשיפה לשער חליפין, או בקשו טיוטה כמו':'I answer from the data in this demo. Try: invoice gaps, trips below the margin line, who is late paying, three-month cash flow, exchange-rate exposure, or ask for a draft like',
'אנשי מכירות':'Sales team','אסי שמרי':'Assi Shamri','אף טיול שהוזמן לא מתחת ל':'No booked trip is below','ארוחות':'Meals','ארכיון':'Archive','אשר ושלח ללקוח':'Approve and send to client',
'אתונה':'Athens','אתם חייבים לספקים כ':'You owe suppliers about','אתר':'Site','אתר להוספה':'Site to add','אתרים שלא שובצו':'Unscheduled sites','אתרים ביום הטיול':'Sites on this day',
'ב':'in','באיחור':'late','באיחור: ':'Overdue: ','בבנייה':'In progress','בדולרים':'In dollars','בהצעה':'In quote','בוצע':'Done','בחירת משתמש':'Choose user','בחשבונית':'In invoice',
'בטיולים':'In trips','ביחס לשנה קודמת':'vs last year','ביטוח':'Insurance','בית ספר':'School','בלוק חדרים במלון':'Hotel room block',
'במחיר. הן מתחלקות שווה בשווה, כך שכל נוסע נושא':'in price. They are split equally, so each traveler carries','במטבעות האלה תעלה כ':'in these currencies would cost about',
'בממוצע, כך שהתכנון הזה':'on average, so this plan is','בניית תוכנית':'Build itinerary','בנק ספקים':'Supplier bank','בסיס':'Basis','בסך הכל. הגדולות':'in total. Largest',
'בעיות חשבונית':'Invoice issues','בקרוב':'Coming soon','ברוכים הבאים ל':'Welcome to ','ברצלונה':'Barcelona','בשער נעול':'At locked rate','בשערים נעולים':'at locked rates','בתפעול':'In operations',
'גבייה':'Collection','גלי אור':'Gali Or','גררו אתר ליום אחר או השתמשו בתפריט. עלות לאדם נשלפת מטבלת העלויות, ושינוי כאן מעדכן את המחיר':'Drag a site to another day or use the menu. Cost per person comes from the cost table, and changing it here updates the price',
'דבלין':'Dublin','דד-ליין':'Deadline','דוגמה למה שדוח ייבוא היסטוריה מציג. המספרים להמחשה בלבד':'An example of what a history import report shows. Numbers are illustrative only',
'דורש טיפול':'Needs attention','דחוף':'Urgent','דף הבית':'Home','דרישת תשלום':'Payment request','דרכון':'Passport','דרכונים חסרים. הרשימה בפורמט שמלונות מבקשים':'passports missing. The list follows the format hotels ask for',
'האתר נוסף יחד עם שורת עלות':'The site was added together with a cost line','הגדרת קובץ':'File settings','הדמו לא מעביר פקודות ליומן ולא גובה תשלומים':'The demo does not post journal entries or collect payments',
'ההורדה מושבתת בדמו':'Downloads are disabled in the demo','ההצעה אושרה והתיק פעיל. המשיכו ללשונית תפעול':'The quote is approved and the file is active. Continue to the Operations tab',
'ההצעה אושרה. התיק נפתח לתפעול.':'Quote approved. The file is open for operations.','ההצעה ממתינה לאישור מנהל. רק מנהל יכול לאשר ולשלוח':'The quote is waiting for manager approval. Only a manager can approve and send',
'ההצעה ממתינה לאישורך. מחיר':'The quote is waiting for your approval. Price','ההצעה נשלחה ללקוח לפני':'The quote was sent to the client','ההצעה נשלחה ללקוח':'The quote was sent to the client','עודכן הסטטוס':'Status updated',
'ההצעות האחרונות':'Latest quotes','הוסף':'Add','הוסף אתר ליום':'Add site to day','הוסף ליום':'Add to day','הוספת אתר מהקטלוג מוסיפה גם שורת עלות.':'Adding a catalog site also adds a cost line.','הועתק':'Copied',
'הוצאה':'Spend','הוצאות משותפות':'Shared expenses','הוצאות פר אדם':'Per-person expenses','הורדה':'Download','הושלמו':'done',
'החלק האיטי בקליטת לקוח הוא העלאת ההיסטוריה שלו. כאן מחירון מבולגן הופך לשורות מסודרות, וכל ספק מסומן. שורות שנוספו מופיעות במחירון':'The slow part of onboarding a client is loading their history. Here a messy price list becomes clean rows, with every doubt flagged. Added rows appear in the price list',
'החשבונית שונה מההצעה ב':'The invoice differs from the quote by','הכל':'All','הכן':'Draft','הכן טיוטה':'Draft a trip for','הכנסה':'Revenue','הכנסות':'Revenue','הכנסות מוזמנות':'Booked revenue',
'הלקוח אישר: פתח תיק':'Client accepted: open file','הלקוח ביקש לסגור':'Client asked to close','הלקוח מוכן לסגור':'The client is ready to close','המחיר ללקוח בדולרים לפי השער הנעול':'client price in dollars at the locked rate',
'המרקאפ מחושב':'Markup is calculated','הנחה':'Discount','הנחות':'Discounts','הנמוך ביותר':'The lowest is','הסעים':'Transport',
'העלויות המשותפות (חדרים, אוטובוס, העברות, מורה דרך) מסתכמות ב':'Shared costs (rooms, coach, transfers, guide) add up to','העלות המתוכננת לפי שער נעול':'Planned cost uses the locked rate',
'הערות':'Notes','העתק הודעה':'Copy message','העתק קישור תשלום':'Copy payment link','הצג':'View','הצג לוח תשלומים':'Show payment schedule','הצג מה כלול במחיר':"Show what's included",'הצג מחיר לנוסע וסך לקבוצה':'Show price per traveler and group total',
'הצעה חדשה':'New quote','הצעה':'Quote','הצעה מול חשבוניות ספקים, בדולרים, כשהשפעת שער החליפין ועמלת הספקים בשורות נפרדות':'Quote against supplier invoices, in dollars, with exchange-rate effect and supplier commission on separate lines',
'הצעות':'quotes','הצעות ותיקים':'quotes and files','הצעות שבוטלו':'Quotes cancelled','הצעות שנסגרו':'Quotes closed','הצעת מחיר':'Quote',
'הקבוצה נוחתת, פוגשת את מורה הדרך ועולה לאוטובוס. אחרי הצ\'ק-אין יוצאים לסיור היכרות':'The group lands, meets the guide and boards the coach. After check-in we head out on an orientation walk',
'הקטגוריה נוספה':'Category added','הרווח הצפוי יהיה':'Expected profit would be','הרץ שוב':'Run again','הרשאות':'Permissions',
'הרשאות לפי תפקיד. החלפת משתמש בטבלה משנה את מה שהמערכת מציגה':'Permissions by role. Switching user in the table changes what the system shows','השורות נוספו למחירון':'Rows added to the price list',
'השפעה על הרווח':'Profit effect','התאמת חשבוניות ספקים':'Supplier invoice matching','התבנית נוספה ליום':'Template added to day','התוצאה אחרי ניקוי':'Result after cleaning','התחזקות של':'A rise of',
'התקבל':'Received','התראה יזומה למנהלים':'Proactive alert to managers','התראות':'Alerts',
'התשובות מחושבות מהנתונים שבעמוד. במערכת אמיתית העוזר יענה מהיסטוריית הטיולים של המפעיל, והטיוטות ישתפרו ככל שנכנסים עוד טיולים':'Answers are calculated from the data on this page. In a real system the assistant answers from the operator\'s own trip history, and drafts improve as more trips are added',
'ואקסל':'and Excel','חברה':'Company','חברות':'Corporate','חדר':'Room','חדרים בבלוק':'Rooms in block','חדרים בשימוש':'Rooms used','חדרים נוצלו מהבלוק':'rooms drawn from the block',
'חדש':'New','חדש בדמו':'New in demo','חודשים':'months','חזרה לרשימה':'Back to list','חייב':'Owed','חייבים':'Receivable','חיפוש':'Search','חיפוש תבנית':'Search templates','חלאל':'Halal','חסר':'Missing','חפש':'Search',
'חריגות':'overrides','חשבוניות חסרות אחרי הטיול':'missing invoices after the trip','חשבוניות שונות מההצעה':'invoices differ from the quote','חשבוניות ששולמו לפי השער ביום התשלום':'Paid invoices use the rate on the payment day',
'חשבוניות, תשלומים ותחזית הרווח':'Invoices, payments and profit forecast','חשבונית':'Invoice','חשיפה':'Exposure',
'טבלת עלויות':'Cost table','טוסקנה':'Tuscany','טיוטה':'Draft','טיול':'Trip','טיול חדש':'New trip','טיולי עבר':'Past trips','טיולים':'Trips','טיולים לפי רווח לנוסע':'Trips ranked by profit per traveler','טיולים מתחת לקו':'Trips below the',
'טיולים קודמים הופכים לתבניות. שכפול יוצר הצעה חדשה עם אותה תוכנית ואותם ספקים, בלי חשבוניות ובלי נוסעים':'Past trips become templates. Duplicating creates a new quote with the same itinerary and suppliers, without invoices or travelers',
'טיולים קודמים מאותו סוג במערכת':'past trips of the same type in the system','טיולים קודמים מהסוג הזה צפויים ל':'Past trips of this type are expected at','טיולים שהוזמנו, הרווח הצפוי':'booked trips, expected profit is',
'טרם הגיע המועד':'Not due yet','טרם נשלח':'Not sent',
'יום איחור':'day late','יום הגעה':'Arrival day','יום חוץ':'Outdoor day','יום מורשת':'Heritage day','יום עזיבה':'Departure day','יום פעילויות':'Activities day','יום':'day',
'יום בטיולים שהסתיימו':'days for trips already finished','יום לפני היציאה, או בעוד':'days before departure, or in','יוצא בעוד':'departs in','ייבוא':'Import',
'ימי איחור':'days late','ימים':'days','ימים ו':'days and','ימים לתשובה':'days for an answer','יעד':'Destination','יציאות קרובות':'Upcoming departures','יתרה':'Balance',
'כל הארצות':'All countries','כל החשבוניות תואמות להצעה.':'Every invoice matches the quote.','כל הטיולים שהוזמנו במקום אחד, בדולרים. הצעות נחשבות צנרת ולעולם לא הכנסה':'All booked trips in one place, in dollars. Quotes count as pipeline, never as revenue',
'כל הסוגים':'All types','כל משפחה או צוות משלמים עבור הנוסעים שלהם בקישור אישי. הסכומים תמיד מתחברים למחיר ללקוח':'Each family or team pays for their travelers through a personal link. Amounts always add up to the client price',
'כלומר':'that is','כמות':'Quantity','כנס':'conference','כספי הטיול':'Trip finance','כספים':'Finance','כללי':'General',
'לא מוצגות ללקוחות':'not shown to clients','לא מוצגת ללקוח':'not shown to client','לא משובץ':'Unscheduled','לאדם':'per person','לאישור מנהל':'Awaiting manager','לאשר מול הספק.':'Confirm with the supplier.',
'לבדיקה':'Check','לדשבורד הכספי':'To the finance dashboard','להעברה':'per transfer','לוח תשלומים':'Payment schedule','לוצרן':'Lucerne','לחדר':'per room',
'לחצו על סטטוס כדי לשנות אותו':'Click a status to change it','ליד חדש':'New lead','ליום':'per day','לידיעה':'FYI','לילה':'night','לילות':'nights','לילות ב':'nights in','ליסבון':'Lisbon',
'לכל מלון יש קיבולת כללית, ואפשר להחזיק בלוק חדרים לתאריכים מסוימים ולנצל אותו כשמשבצים נוסעים':'Each hotel has a general capacity, and you can hold a room block for specific dates and draw it down as travelers are assigned',
'ללא גלוטן':'Gluten-free','ללא':'None','לממוצע':'to the average','לנוסע':'per traveler','לנוסע), עלות מתוכננת':'per traveler), planned cost','לספקים':'To suppliers','לקוח':'Client','לקוח חדש':'New client',
'לשלב אישור ההצעה':'To quote approval','לתשלום לספקים, נטו':'to pay suppliers, net',
'מאחר':'late','מדינה':'Country','מדריד':'Madrid','מהמחיר':'of price','מהמחיר הוא מחיר שווה לעלות חלקי':'of price means price equals cost divided by','מהרווח':'of profit','מוכר':'Salesperson',
'מול':'vs','מול תכנון':'vs plan','מועד יתרה':'Balance due','מועד מקדמה':'Deposit due','מועדון':'Club','מוצג כמשתמש אחר':'Now viewing as another user','מורה דרך':'Guide',
'מזומן':'Cash','מחיר':'Price','מחיר בדולרים, הומר ליורו בשער':'Price in USD, converted to EUR at','מחיר ללילה':'Price per night','מחיר ללקוח':'Client price','מחיר מתוכנן':'Planned price','מחירון':'Price list','מחר':'Tomorrow',
'מטבע':'Currency','מטבע לא צוין. הונח יורו, צריך בדיקה.':'Currency not stated. Assumed EUR, needs a check.','מטבע ספקים':'Supplier currency','מיובא':'Imported','מייבוא':'From import','מלון':'Hotel','מלונות':'Hotels',
'מלקוחות':'from clients','ממתין לסגירה':'Awaiting close','ממתינה':'waiting','ממתינות':'Pending','מסמכים':'Documents','מספר נוסעים':'Travelers','מעל העלות':'above cost',
'מעל':'above','מקדמה':'Deposit','מקדמה שולמה':'Deposit paid','מקהל':'choir','מקהלה':'Choir','מקהלות':'Choirs',
'מרווח מתוכנן לרווח צפוי':'From planned to expected profit','מרקאפ':'Markup','מרקאפ חריג':'Markup override','משימה':'Task','משימות באיחור':'tasks overdue','משפח':'family','משפחה':'Family','משפחות ורב-דורי':'Families and multigenerational',
'משתמש':'User','משתמשים':'Users','מתוך':'of','מתוכנן':'Planned','מתוכנן, שינוי של':'planned, a change of','מתחת':'below','מתחת לקו':'below the',
'נבנה מרשימת המשימות למטה':'Built from the task list below','נבנתה לפי המבנה של':'Built from the structure of','נוסע':'Traveler','נוסעים':'travelers','נוסעים וחיוב':'Travelers and billing',
'נוסף בדמו':'Added in the demo','נוסף למחירון':'Added to price list','הוסף למחירון':'Add to price list','נוצרה הצעה חדשה':'New quote created','נוצרה טיוטת הצעה':'Draft quote created',
'נותר לשלם':'Still to pay','נחשבות צנרת ולא הכנסה':'count as pipeline, not revenue','נטו':'Net','ניתנים לשחרור':'can be released','נסגר':'Closed','נסגרו':'Closed',
'נפתח אחרי אישור ההצעה':'opens after quote approval','נקי':'Clean','נשלח':'Sent','נשלח ללקוח':'Sent to client','נשמר כטיוטה':'Saved as draft','נתוני השנים הקודמות פיקטיביים':'Figures for previous years are fictional',
'סביליה':'Seville','סגירה כספית':'Financial close','סגירות':'Closing','סה"כ':'Total','סה"כ השפעה':'Total effect','סה"כ לאדם':'Total per person','סוג':'Type','סוג הנחה':'Discount type','סוג השירות':'Service type','סוג מרקאפ':'Markup type','סוג קבוצה':'Group type',
'סוכן':'Agent','סוכנים רואים רק את התיקים שלהם. עברו לתצוגת מנהל כדי לראות הכול':'Agents only see their own files. Switch to the manager view to see everything','סוכנת':'Agent',
'סטטוס':'Status','סטטיסטיקת הצעות מחיר':'Quote statistics','סינון לפי יעד':'Filter by destination','סינון לפי סוג קבוצה':'Filter by group type','סך הכל':'Total','סכום':'Amount','סכומי ספקים':'Supplier amounts',
'סכומי ספקים מעל או מתחת להצעה':'Supplier amounts above or below quote','סמנו והעתיקו ידנית':'Select and copy manually','סנכרון הנהלת חשבונות וסליקה':'Accounting and payment sync',
'ספק':'Supplier','ספקים':'Suppliers','ספקים מובילים':'Top suppliers','ספקים מקובצים לקטגוריות שאתם מגדירים. שירותים מתומחרים לפי סוג, כך שאפשר להחליף ספק בלי לתמחר מחדש':'Suppliers are grouped into categories you define. Services are priced by type, so a supplier can be swapped without re-pricing',
'עד':'by','עדיין אין חשבונית':'no invoice yet','עדיין בשלב הצעה':'is still at the quote stage','עוד לגבות':'Still to collect','עוד לגבות בכל הטיולים שהוזמנו':'Still to collect across all booked trips',
'עוזר חכם':'Assistant','עומס':'Overload','עותק':'copy','עיר':'City','על העלות':'On cost','על העלות הוא שולי רווח של':'on cost is a margin of','עלויות הספקים במטבע':'Supplier costs are in',
'עלויות לפי סוג שירות ויעד, במטבע של כל ספק. שורות מיובאות מופיעות בסוף':"Costs by service type and destination, in each supplier's currency. Imported rows appear at the end",
'עלויות פר אדם, כמו כרטיסים וארוחות, מחויבות לכל אחד ישירות. קבוצה של שניים משלמת פעמיים':'Per-person costs, such as tickets and meals, are charged to each person directly. A group of two pays twice',
'עלות':'Cost','עלות יחידה':'Unit cost','עלות לאדם':'Cost per person','עלות לפי סוג':'Cost by type','עלות מתוכננת':'Planned cost','עם צרכי תזונה':'with dietary needs','עמלה':'Commission',
'עמלות ספקים':'Supplier commission','עמלות ספקים ושולי רווח אף פעם לא מופיעים במסמך ללקוח':'Supplier commission and margins never appear in the client document','עמלת ספקים (לא מוצגת ללקוח)':'Supplier commission (not shown to client)','עמלת ספקים צפויה':'Expected supplier commission',
'פירוט שורות':'Line detail','פעילויות':'Activities','פער':'Gap','פערי חשבוניות ו':'invoice gaps and','פרוייקטים':'Projects','פרטים כלליים':'General details','פריז':'Paris','פריט':'Item','פריטי ספק פתוחים':'open supplier items',
'פריורטי וחשבשבת':'Priority and Hashavshevet','פתוח':'Open','פתוחות':'open','פתח':'Open',
'צוות':'team','צור הצעה מהטיוטה':'Create quote from draft','צור הצעה מתבנית':'Create quote from template','צור הצעת מחיר':'Create quote','צילום':'Photography','צמחוני':'Vegetarian','צפה כמשתמש':'View as this user','צפוי':'Expected','צפויים מלקוחות':'expected from clients','צפייה כ':'View as',
'קבוצה':'Group','קבוצות':'groups','קבוצות חיוב':'Billing groups','קבוצות חיוב באיחור':'billing groups late','קבוצות חיוב באיחור בתשלום, בסך':'billing groups are late on payment, totaling','קבוצת':'a group of','קבוצת חיוב':'Billing group',
'קו התראה':'Alert line','קו התראה לשולי רווח':'Margin alert line','קובץ שהועלה (דוגמה':'Uploaded file (example','קטגוריה':'Category','קטגוריה חדשה':'New category',
'קטלוג האתרים והפעילויות. כל אתר מביא איתו ספק, עלות לאדם, עמלה ומשך מוערך שמזין את בדיקת העומס ביום':'The catalog of sites and activities. Each site brings a supplier, cost per person, commission and an estimated duration that feeds the daily load check','קשיש':'senior',
'רווח':'Profit','רווח לנוסע':'Profit per traveler','רווח מתוכנן':'Planned profit','רווח מתוכנן מול צפוי, לפי טיול':'Planned vs expected profit, by trip','רווח צפוי':'Expected profit','רווח צפוי לפי יעד':'Expected profit by destination','רווח צפוי לפי סוג קבוצה':'Expected profit by group type',
'רווחיות':'profitability','רומא':'Rome','רשימת חדרים ונוסעים':'Rooming list and travelers','רשימת משימות':'Task list',
'שאלה':'Question','שאלו על חשבוניות, שולי רווח, תשלומים':'Ask about invoices, margins, payments','שאלו על טיולים, חשבוניות, תשלומים או תזרים, או בחרו אחת השאלות למעלה':'Ask about trips, invoices, payments or cash flow, or pick one of the questions above',
'שובר לספק':'Supplier voucher','שוכפל כהצעה חדשה':'Duplicated as a new quote','שולי':'margin','שולי רווח':'Margins','שולי רווח צפויים':'expected margin','שולם':'Paid','שולם במלואו':'Paid in full','שולם בשער':'Paid at rate',
'שורות':'rows','שורות ניתנות להוספה. שורות שדורשות בדיקה שומרות את הדגל, כדי שלא ינחשו בשקט':'rows can be added. Rows needing a check keep their flag, so nothing is guessed silently','שורות ספק בלי חשבונית':'supplier lines without an invoice',
'שינוי':'Change','שינוי מטבע באחוזים':'Currency move percent','שירות':'Service','שכפל':'Duplicate','שלב':'Stage','שלום':'Hello','שלושת החודשים הקרובים':'Next three months','שלח':'Send','שלח לאישור מנהל':'Send for manager approval',
'שם':'Name','שם הפרוייקט':'Project name','שמור והמשך':'Save and continue','שמור טיוטה':'Save draft','שעות':'hours','שעות ביום הזה. קבוצות בדרך כלל מחזיקות כ':'hours on this day. Groups usually manage about','שעות, אז סביר שהלו"ז יחרוג':'hours, so the schedule will likely slip',
'שער':'Rate','שער נעול לדולר':'Locked rate to USD','שער נעול':'Locked rate','שער נעול, דולר ל':'Locked rate, USD per','שער ששולם':'Rate paid','שער ששולם מול שער נעול':'Rate paid vs locked rate','שרית חדד':'Sarit Haddad',
'ת':'','תאריך טיול':'Trip dates','תאריכי טיול':'Trip dates','תבניות':'Templates','תבניות יום':'Day templates','תבנית הודעה לספק':'Supplier message template','תואם':'Match','תוכנית מאסטר':'Master plan','תוצאה':'Result','תזונה':'Dietary',
'תזרים':'cash flow','תזרים ל':'Cash flow, next','תיק חדש':'New file','תיק נפתח':'File opened','תיקים':'files','תיקים עם בלוק':'Files with a block','תכנון':'plan','תלמידים':'Students','תלמידים בסביליה':'students in Seville',
'תמונת מצב כספית':'Financial snapshot','תנאי תשלום (ימים':'Payment terms (days','תסריט מוכן':'Scripted','תפעול':'Operations','תפקיד':'Role','תקציר למנהלים, מחר':'Manager digest, tomorrow','תרחיש שער חליפין':'Exchange-rate scenario','תשלום':'Payment',
'תשלומי לקוחות צפויים מול תשלומי ספקים שנותרו. פיגורים נספרים בחודש הנוכחי. ספקים משולמים':'Expected client payments against supplier payments still due. Late items count in the current month. Suppliers are paid',
/* fragments of dynamic sentences */
'מנהלת':'manager','מנהל':'manager','בדיקה':'check','סוכן/ת':'agent','סוכן/ת)':'agent)','כסף':'money','מקדמה ':'Deposit','מנהל יכול':'a manager can',
'קבוצות חיוב באיחור בתשלום':'billing groups are late on payment','פערי חשבוניות':'invoice gaps','חשבוניות חסרות':'missing invoices','יוצא':'departs','משימות':'tasks','טיולים שהוזמנו':'booked trips',
'ממתינה ימים':'waiting days','ההצעה':'The quote','ממתינה':'waiting','אחרי הטיול':'after the trip','בעוד':'in','ושולי':'and margin','מתחת ל':'below','עד לקו':'to the line',
'מנהלים':'managers','תיקים עם':'files with','הצעה ל':'Quote for','קבוצות באיחור':'groups late','סוג השירות ':'Service type','סה"כ ':'Total ','תשלום ללקוח':'Client payment','ללקוח':'to client','לספקים ':'to suppliers ',
'ב-':'in ','ו':'and','ל':'to','לא':'not','אחרי':'after','כ':'about','עם':'with','של':'of','על':'on','או':'or','מ':'from','כל':'every','בלי':'without','הצעת':'Quote','שנים':'years','שנה':'year','חדשה':'new','ממתין':'pending','שבוטלו':'cancelled'
};
DICT['ת']=undefined;delete DICT['ת'];DICT['עברית']='עברית';DICT['הצעת מחיר']='Quotes';
const HP={'ו':'and ','ב':'in ','ל':'to ','מ':'from ','ה':'the ','ש':'that '};
const HW=/[א-ת]+(?:["'׳״][א-ת]+)*/;
function trWord(w){
  if(DICT[w]!==undefined)return DICT[w];
  if(w.length>2&&HP[w[0]]&&DICT[w.slice(1)]!==undefined)return HP[w[0]]+DICT[w.slice(1)];
  return null;
}
function trChunk(m){
  if(DICT[m]!==undefined)return DICT[m];
  const sp=m.split(/([.!?:;]\s+)/);
  if(sp.length>1){let o='';for(let i=0;i<sp.length;i+=2){o+=trChunk(sp[i])+(sp[i+1]||'');}return o;}
  const parts=m.split(/([ \u00A0,.:;!?()\-\/]+)/);const words=[],seps=[];
  parts.forEach((p,i)=>{(i%2?seps:words).push(p);});
  let out='',i=0;
  while(i<words.length){
    let done=false;
    for(let n=Math.min(8,words.length-i);n>=1;n--){
      let key=words[i];for(let j=1;j<n;j++)key+=seps[i+j-1]+words[i+j];
      let r=DICT[key];if(r===undefined&&n===1)r=trWord(words[i]);
      if(r!==undefined&&r!==null){out+=(i>0?seps[i-1]:'')+r;i+=n;done=true;break;}
    }
    if(!done){out+=(i>0?seps[i-1]:'')+words[i];i++;}
  }
  return out;
}
const HE_RE=/[א-ת]+(?:["'׳״][א-ת]+)*(?:[  ,.:;!?()\-\/]+[א-ת]+(?:["'׳״][א-ת]+)*)*/g;
function trHe(str){
  if(S.lang!=='en'||typeof str!=='string')return str;
  return str.replace(HE_RE,(m,off,all)=>{let o=trChunk(m);const nx=all[off+m.length]||'',pv=off?all[off-1]:'';
    if(o&&/[A-Za-z0-9⁦$€£#]/.test(nx))o+=' ';if(o&&/[A-Za-z0-9⁩]/.test(pv))o=' '+o;return o;})
    ;
}
function trHtml(h){
  if(S.lang!=='en')return h;
  return h.replace(/(<[^>]*>)|([^<]+)/g,(m,tag,txt)=>tag?tag.replace(/\b(placeholder|aria-label|title|value)="([^"]*)"/g,(x,a,v)=>`${a}="${trHe(v)}"`):trHe(txt));
}
Object.assign(DICT,{
'יום':'Day','ברוכים הבאים':'Welcome','תיקים':'files','ליום':'per day',
'עמלת ספקים (לא מוצגת ללקוח':'Supplier commission (not shown to client','מטבע לא צוין. הונח יורו, צריך בדיקה':'Currency not stated. Assumed EUR, needs a check',
'רואה ועורכת רק את התיקים שלה':'Sees and edits only her own files','רואה ועורך רק את התיקים שלו':'Sees and edits only his own files',
'רואה את כל התיקים, מאשרת הצעות ורואה את הכספים':'Sees all files, approves quotes and sees finance',
'בונה הטיולים לומד מטיולים שיובאו, ולכן ההצעות מתאימות למפעיל כבר בשבוע הראשון':'The trip builder learns from imported trips, so quotes fit the operator from the first week',
'לאשר מול הספק':'Confirm with the supplier','אין מחיר בקובץ. יש לשאול את הספק':'No price in the file. Ask the supplier',
'גררו אתר ליום אחר או השתמשו בתפריט. עלות לאדם נשלפת מטבלת העלויות, ושינוי כאן מעדכן את המחיר. הוספת אתר מהקטלוג מוסיפה גם שורת עלות':'Drag a site to another day or use the menu. Cost per person comes from the cost table, and changing it here updates the price. Adding a catalog site also adds a cost line',
'סוכן/ת':'agent','סוכנת/ת':'agent'});
function LOC(){try{return S.lang==='en'?'en-US':'he-IL';}catch(e){return 'he-IL';}}
