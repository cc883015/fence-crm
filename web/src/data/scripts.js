/** Bilingual sales scripts for New Customer wizard */
export const INTAKE_STEPS = [
  {
    id: "source",
    num: "1",
    title_zh: "来源",
    title_en: "Lead source",
    script_zh: "先确认客户是电话、官网还是其他渠道过来的。",
    script_en: "Confirm whether this enquiry came by phone, website, or another channel.",
    type: "choice",
    options: [
      { value: "phone", zh: "电话", en: "Phone" },
      { value: "website", zh: "官网订单", en: "Website order" },
      { value: "facebook", zh: "Facebook", en: "Facebook" },
      { value: "referral", zh: "朋友推荐", en: "Referral" },
      { value: "walk_in", zh: "展厅到访", en: "Showroom walk-in" },
    ],
  },
  {
    id: "service_area",
    num: "2",
    title_zh: "服务区域 & 尺寸",
    title_en: "Service area & size",
    script_zh: "如果客户问服务范围，先确认，再马上问院子大概尺寸。",
    script_en:
      "We provide fencing supply and installation services across Brisbane, Logan, Ipswich and the Gold Coast.",
    script_en2:
      "If you have an approximate measurement, I can give you a rough quote first. Do you know the approximate size or length of the area you'd like to fence?",
    script_zh2: "如果您有大概尺寸，我可以先给您一个初步报价。您想要安装的院子尺寸是多少呢？",
    type: "area_length",
  },
  {
    id: "gate",
    num: "3",
    title_zh: "电动门",
    title_en: "Automatic gate",
    script_zh: "先回答客户问题，再追问要不要电动门、门宽大概多少。",
    script_en:
      "Do you need an automatic gate? If so, approximately how wide would you like it to be? Most home driveways are usually around 4–6 metres wide.",
    type: "gate",
  },
  {
    id: "install",
    num: "4",
    title_zh: "安装方式",
    title_en: "Install type",
    script_zh: "问清楚是砌砖+围栏，还是围栏直接落地。不确定可给两套估价。",
    script_en:
      "Are you looking for a brick wall with fencing on top, or a fence installed directly to the ground?",
    script_en2:
      "I can give you two estimates, one with a brick wall and one without, so you can compare the prices and decide which option you prefer.",
    script_zh2: "我可以给您两套估价（带砖墙 / 不带），方便您对比选择。",
    type: "install",
  },
  {
    id: "style",
    num: "5",
    title_zh: "确认款式",
    title_en: "Fence style",
    script_zh: "这一步很重要——确认客户喜欢的围栏款式。",
    script_en: "Please have a look and let me know which style you like best.",
    type: "style",
  },
  {
    id: "color",
    num: "6",
    title_zh: "颜色",
    title_en: "Colour",
    script_zh: "现货通常有 2 种颜色可选。",
    script_en: "We usually have 2 colours available — Black or Grey.",
    type: "choice",
    options: [
      { value: "Black", zh: "黑色 Black", en: "Black" },
      { value: "Grey", zh: "灰色 Grey", en: "Grey" },
    ],
  },
  {
    id: "slope",
    num: "7",
    title_zh: "斜坡 & 照片",
    title_en: "Slope & photos",
    script_zh: "房子有斜坡吗？方便的话可以发一张院子照片，不方便也没关系，可以先估价。",
    script_en: "Is your property on a slope?",
    script_en2:
      "Would it be convenient for you to send me a photo now? If not, that's perfectly fine. I can provide you with an estimated quote first, and you can send the photo later when it's convenient for you.",
    script_zh2:
      "你现在方便给我提供一个要安装围栏的院子的照片吗？不方便也完全没问题，我可以先给初步报价。",
    type: "slope",
  },
  {
    id: "contact",
    num: "8",
    title_zh: "联系人信息",
    title_en: "Contact details",
    script_zh: "收集姓名、电话、邮箱和 suburb，方便发初步报价。",
    script_en:
      "I'll send you a preliminary quote first. If the estimate is within your budget, we can arrange a site visit to take accurate measurements and provide a final quotation.",
    type: "contact",
  },
  {
    id: "deposit",
    num: "9",
    title_zh: "定金与价保说明",
    title_en: "Deposit & price match",
    script_zh:
      "如果现场测量后的报价满意，我们只需收取 200 澳元定金确认项目，定金可全额抵扣围栏总价。",
    script_en:
      "If you are satisfied with the quote after the on-site measurement, we only need to collect a $200 AUD deposit to confirm the project. The deposit will be fully deducted from the final fence price.",
    script_en2:
      "If you find the same specification product at a lower price before installation, we'll refund your deposit in full.",
    script_zh2: "如果您在安装开始前找到相同规格更低报价，我们将全额退还定金。",
    type: "deposit",
  },
];
