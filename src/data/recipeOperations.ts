export type RecipeOperationMeta = {
  shelfLifeDays: number;
  storage: string;
  packaging: string;
  imageUrl: string;
  imageAlt: string;
  recommendedBatchGrams: number;
};

// صور مرجعية حقيقية من Unsplash. يمكن استبدالها لاحقاً بصور منتجات المعمل الفعلية.
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`;
const IMAGES = {
  cake: photo('photo-1578985545062-69928b1d9587'),
  bakery: photo('photo-1509440159596-0249088772ff'),
  pastry: photo('photo-1555507036-ab1c4c8d5b1f'),
  drink: photo('photo-1726039413774-614d0ca53d02'),
  kunafa: photo('photo-1741424605439-9b3b0f54d755'),
  baklava: photo('photo-1772729294786-7a264601887b'),
  cookies: photo('photo-1689425863266-3b7432f9006b'),
  samosa: photo('photo-1772729996007-40bad08b3c40'),
  cupcakes: photo('photo-1573050435329-27ff3181380c'),
  bread: photo('photo-1737093818249-8c72f5943350'),
};

export const RECIPE_OPERATION_META: Record<string, RecipeOperationMeta> = {
  'sponge-basic': { shelfLifeDays: 7, storage: 'مغلق ومحكم، بعيداً عن الحرارة والضوء؛ يفضّل التبريد حسب الحشوة.', packaging: 'كيس/علبة غذائية محكمة مع تاريخ الإنتاج والانتهاء.', imageUrl: photo('photo-1578985545062-69928b1d9587'), imageAlt: 'كيك إسفنجي', recommendedBatchGrams: 10000 },
  'sponge-cocoa': { shelfLifeDays: 7, storage: 'عبوة محكمة وجافة؛ التبريد إذا أضيفت حشوة طازجة.', packaging: 'عبوة فردية أو كرتون توزيع للبقالات.', imageUrl: photo('photo-1571115177098-24ec42ed204d'), imageAlt: 'كيك إسفنجي بالكاكاو', recommendedBatchGrams: 10000 },
  'plain-cake': { shelfLifeDays: 7, storage: 'مكان جاف وبارد نسبياً داخل عبوة محكمة.', packaging: 'عبوة محكمة مع ملصق الصلاحية.', imageUrl: photo('photo-1563729784474-d77dbb933a9e'), imageAlt: 'كيك سادة', recommendedBatchGrams: 10000 },
  'cupcake-basic': { shelfLifeDays: 7, storage: 'عبوة فردية محكمة؛ الحشوات اللبنية تحتاج سلسلة تبريد وصلاحية أقصر.', packaging: 'أكياس أو علب فردية غذائية.', imageUrl: photo('photo-1519869325930-281384150729'), imageAlt: 'كب كيك', recommendedBatchGrams: 10000 },
  'basbousa': { shelfLifeDays: 7, storage: 'مبردة أو في مكان مناسب حسب الشيرة والحشوة.', packaging: 'صينية محكمة أو علب فردية.', imageUrl: photo('photo-1488477181946-6428a0291777'), imageAlt: 'بسبوسة', recommendedBatchGrams: 10000 },
  'basbousa-coconut': { shelfLifeDays: 7, storage: 'مبردة عند الحاجة وبعبوة محكمة.', packaging: 'علب غذائية محكمة.', imageUrl: photo('photo-1576618148400-f54bed99fcfd'), imageAlt: 'بسبوسة جوز الهند', recommendedBatchGrams: 10000 },
  'kunafa-cheese': { shelfLifeDays: 3, storage: 'تبريد إلزامي للحشوة اللبنية؛ لا تعتمد أسبوعاً لهذه الوصفة الطازجة.', packaging: 'علبة غذائية محكمة مع تبريد.', imageUrl: photo('photo-1741424605439-9b3b0f54d755'), imageAlt: 'كنافة بالجبن', recommendedBatchGrams: 5000 },
  'kunafa-cream': { shelfLifeDays: 3, storage: 'تبريد مستمر للحشوة اللبنية.', packaging: 'علبة محكمة مبردة.', imageUrl: photo('photo-1601050690597-df0568f70950'), imageAlt: 'كنافة بالقشطة', recommendedBatchGrams: 5000 },
  'kunafa-fingers': { shelfLifeDays: 5, storage: 'أفضل مبردة إذا كانت الحشوة طازجة؛ المنتج الجاف غير المحشو يختلف.', packaging: 'علب محكمة بعد التبريد.', imageUrl: photo('photo-1614707267537-b85aaf00c4b7'), imageAlt: 'أصابع كنافة', recommendedBatchGrams: 5000 },
  'baklava': { shelfLifeDays: 14, storage: 'جاف ومحكم وبعيد عن الرطوبة والحرارة.', packaging: 'علب محكمة مناسبة للجملة.', imageUrl: photo('photo-1772729294786-7a264601887b'), imageAlt: 'بقلاوة', recommendedBatchGrams: 10000 },
  'balasham': { shelfLifeDays: 7, storage: 'جاف ومحكم؛ الشيرة قد تؤثر في القوام مع الوقت.', packaging: 'علبة محكمة مقاومة للرطوبة.', imageUrl: photo('photo-1551024506-0bccd828d307'), imageAlt: 'بلح الشام', recommendedBatchGrams: 10000 },
  'awamat': { shelfLifeDays: 5, storage: 'محكم وجاف؛ الجودة الحسية أفضل خلال الأيام الأولى.', packaging: 'عبوة مقاومة للرطوبة.', imageUrl: photo('photo-1587314168485-3236d6710814'), imageAlt: 'عوامة', recommendedBatchGrams: 10000 },
  'maamoul': { shelfLifeDays: 14, storage: 'جاف ومحكم بعيداً عن الحرارة والرطوبة.', packaging: 'أكياس/علب محكمة للجملة.', imageUrl: photo('photo-1558961363-fa8fdf82db35'), imageAlt: 'معمول', recommendedBatchGrams: 10000 },
  'cookies': { shelfLifeDays: 30, storage: 'جاف ومحكم بعيداً عن الرطوبة.', packaging: 'كيس محكم أو علبة مع حاجز رطوبة.', imageUrl: photo('photo-1689425863266-3b7432f9006b'), imageAlt: 'بسكويت اقتصادي', recommendedBatchGrams: 20000 },
  'tea-biscuit': { shelfLifeDays: 30, storage: 'جاف ومحكم.', packaging: 'تعبئة فردية أو جملة مقاومة للرطوبة.', imageUrl: photo('photo-1499636136210-6f4ee915583e'), imageAlt: 'بسكويت شاي', recommendedBatchGrams: 20000 },
  'samosa': { shelfLifeDays: 7, storage: 'تبريد محكم للعجينة الطازجة؛ يمكن التجميد وفق اختبار الجودة.', packaging: 'أكياس غذائية محكمة بوزن ثابت.', imageUrl: photo('photo-1772729996007-40bad08b3c40'), imageAlt: 'رقائق سمبوسة', recommendedBatchGrams: 20000 },
  'pizza-dough': { shelfLifeDays: 7, storage: 'مبردة ومحكمة؛ التجميد خيار تشغيلي بعد اختبار الجودة.', packaging: 'أكياس غذائية موزونة.', imageUrl: photo('photo-1565299624946-b28f40a0ae38'), imageAlt: 'عجينة بيتزا', recommendedBatchGrams: 20000 },
  'fatayer': { shelfLifeDays: 3, storage: 'تبريد مستمر بسبب الجبن والبيض؛ لا تعتمد أسبوعاً دون تحقق مخبري.', packaging: 'علب مبردة محكمة.', imageUrl: photo('photo-1555507036-ab1f4038808a'), imageAlt: 'فطائر جبن', recommendedBatchGrams: 10000 },
  'croissant': { shelfLifeDays: 5, storage: 'محكم وجاف؛ الحشوات الطازجة تحتاج تبريداً وصلاحية منفصلة.', packaging: 'أكياس أو علب غذائية.', imageUrl: photo('photo-1555507036-ab1c4c8d5b1f'), imageAlt: 'كرواسون', recommendedBatchGrams: 10000 },
  'bread': { shelfLifeDays: 7, storage: 'محكم وجاف ومناسب للحرارة المحلية؛ يمنع التكاثف داخل الكيس.', packaging: 'أكياس غذائية تسمح بالتعبئة الصحيحة بعد التبريد.', imageUrl: photo('photo-1737093818249-8c72f5943350'), imageAlt: 'خبز', recommendedBatchGrams: 20000 },
  'raisin-drink': { shelfLifeDays: 7, storage: 'مبرد باستمرار في عبوة غذائية مغلقة؛ لا يترك خارج التبريد.', packaging: 'زجاجة غذائية محكمة مع تاريخ الإنتاج والانتهاء.', imageUrl: photo('photo-1513558161293-cdaf765edfd7'), imageAlt: 'مشروب زبيب', recommendedBatchGrams: 20000 },
  'barley-drink': { shelfLifeDays: 7, storage: 'مبرد باستمرار وبعبوة مغلقة؛ يحتاج تحقق صلاحية قبل البيع التجاري.', packaging: 'زجاجة غذائية محكمة.', imageUrl: photo('photo-1544145945-f90425340c7e'), imageAlt: 'مشروب شعير', recommendedBatchGrams: 20000 },
  'ginger-drink': { shelfLifeDays: 7, storage: 'مبرد باستمرار وبعبوة مغلقة؛ لا تعتمد الصلاحية دون اختبار المنتج النهائي.', packaging: 'زجاجة غذائية محكمة.', imageUrl: photo('photo-1517701604599-bb29b565090c'), imageAlt: 'مشروب زنجبيل', recommendedBatchGrams: 20000 },
  'berry-drink': { shelfLifeDays: 7, storage: 'مبرد باستمرار؛ اختبار الصلاحية ضروري قبل التوزيع.', packaging: 'زجاجة غذائية محكمة.', imageUrl: photo('photo-1497534446932-c925b458314e'), imageAlt: 'مشروب توت', recommendedBatchGrams: 20000 },
  'lemon-drink': { shelfLifeDays: 5, storage: 'مبرد باستمرار وبعبوة مغلقة.', packaging: 'زجاجة غذائية محكمة.', imageUrl: photo('photo-1726039413774-614d0ca53d02'), imageAlt: 'مشروب ليمون', recommendedBatchGrams: 20000 },
  'date-milk': { shelfLifeDays: 2, storage: 'تبريد مستمر؛ الحليب الطازج لا يُفترض أن يدوم أسبوعاً دون معالجة صناعية معتمدة.', packaging: 'عبوة غذائية مبردة.', imageUrl: photo('photo-1505252585461-04db1eb84625'), imageAlt: 'حليب بالتمر', recommendedBatchGrams: 10000 },

  'kunafa-dough': { shelfLifeDays: 2, storage: 'يحفظ مبرداً ومحكماً، أو مجمداً بعد اختبار الجودة؛ لا تعتمد المدة دون تحقق فعلي.', packaging: 'أكياس غذائية محكمة بوزن ثابت مع تاريخ الإنتاج.', imageUrl: photo('photo-1517433670267-08bbd4be890f'), imageAlt: 'عجينة ومعجنات مرجعية', recommendedBatchGrams: 20000 },
  'baklava-sheets': { shelfLifeDays: 2, storage: 'تحفظ مبردة ومحكمة لمنع الجفاف والتلوث؛ التجميد يحتاج اختباراً للملمس والجودة.', packaging: 'فواصل غذائية وأكياس محكمة تمنع الجفاف.', imageUrl: photo('photo-1608198093002-ad4e005484a0'), imageAlt: 'رقائق ومعجنات مرجعية', recommendedBatchGrams: 20000 },
  'cream-filling': { shelfLifeDays: 2, storage: 'تبريد مستمر وسريع بعد التحضير؛ هذه مدة احترازية مرجعية وليست اعتماداً صحياً للصلاحية.', packaging: 'عبوة غذائية محكمة ومبردة مع تسجيل وقت التحضير.', imageUrl: photo('photo-1573050435329-27ff3181380c'), imageAlt: 'حشوة حلويات مرجعية', recommendedBatchGrams: 5000 },
  'sugar-syrup': { shelfLifeDays: 7, storage: 'يحفظ في وعاء نظيف محكم بعد التبريد؛ الصلاحية تتغير حسب التركيز والنظافة وطريقة التعبئة.', packaging: 'عبوة غذائية محكمة مع تاريخ التحضير.', imageUrl: photo('photo-1606313564200-e75d5e30476c'), imageAlt: 'شيرة وقطر مرجعي', recommendedBatchGrams: 20000 },
};

export const DEFAULT_RECIPE_OPERATION_META: RecipeOperationMeta = {
  shelfLifeDays: 7,
  storage: 'عبوة غذائية محكمة، مع اختبار الصلاحية الفعلي قبل التوزيع.',
  packaging: 'عبوة غذائية محكمة تحمل تاريخ الإنتاج والانتهاء.',
  imageUrl: IMAGES.bakery,
  imageAlt: 'منتج مخبوز',
  recommendedBatchGrams: 10000,
};
