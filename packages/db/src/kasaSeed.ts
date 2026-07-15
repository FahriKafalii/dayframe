// Default Kasa categories — seeded for each user on first finance access.
// Single canonical key (snake_case English, immutable). Names resolved from i18n at render time.

export type SeedCategoryType = "income" | "expense" | "transfer" | "saving";
export type SeedKindDefault = "need" | "want" | "saving";

export interface SeedCategory {
  key: string;
  type: SeedCategoryType;
  kindDefault?: SeedKindDefault;
  emoji: string;
  color: string;
  excludedFromReports?: boolean;
  name: { tr: string; en: string };
  children?: SeedCategory[];
}

export const KASA_SEED_CATEGORIES: SeedCategory[] = [
  // ============ INCOME ============
  {
    key: "salary",
    type: "income",
    emoji: "briefcase",
    color: "#4C8BF5",
    name: { tr: "Maaş & Ücret", en: "Salary & Wages" },
    children: [
      { key: "salary_main", type: "income", emoji: "briefcase", color: "#4C8BF5", name: { tr: "Maaş", en: "Salary" } },
      { key: "salary_overtime", type: "income", emoji: "clock", color: "#4C8BF5", name: { tr: "Mesai", en: "Overtime" } },
      { key: "salary_bonus", type: "income", emoji: "sparkles", color: "#4C8BF5", name: { tr: "Prim & Bonus", en: "Bonus" } },
      { key: "salary_benefits", type: "income", emoji: "gift", color: "#4C8BF5", name: { tr: "Yan Haklar", en: "Benefits" } },
    ],
  },
  {
    key: "freelance",
    type: "income",
    emoji: "laptop",
    color: "#5BA689",
    name: { tr: "Serbest & Ek Gelir", en: "Freelance & Side Income" },
    children: [
      { key: "freelance_work", type: "income", emoji: "laptop", color: "#5BA689", name: { tr: "Serbest İş", en: "Freelance" } },
      { key: "freelance_consulting", type: "income", emoji: "users", color: "#5BA689", name: { tr: "Danışmanlık", en: "Consulting" } },
      { key: "freelance_tips", type: "income", emoji: "coin", color: "#5BA689", name: { tr: "Bahşiş", en: "Tips" } },
    ],
  },
  {
    key: "investment_income",
    type: "income",
    emoji: "chart-up",
    color: "#2FA37C",
    name: { tr: "Yatırım Geliri", en: "Investment Income" },
    children: [
      { key: "inv_dividends", type: "income", emoji: "chart-up", color: "#2FA37C", name: { tr: "Temettü", en: "Dividends" } },
      { key: "inv_interest", type: "income", emoji: "percent", color: "#2FA37C", name: { tr: "Faiz Geliri", en: "Interest" } },
      { key: "inv_fx_gold", type: "income", emoji: "coin", color: "#2FA37C", name: { tr: "Döviz/Altın Kazancı", en: "FX & Gold Gains" } },
    ],
  },
  {
    key: "rental_income",
    type: "income",
    emoji: "house-key",
    color: "#C28A4A",
    name: { tr: "Kira Geliri", en: "Rental Income" },
  },
  {
    key: "gifts_in",
    type: "income",
    emoji: "gift",
    color: "#D8709E",
    name: { tr: "Hediye & Transferler", en: "Gifts & Transfers In" },
    children: [
      { key: "gift_received", type: "income", emoji: "gift", color: "#D8709E", name: { tr: "Hediye", en: "Gift" } },
      { key: "bayram_money", type: "income", emoji: "gift", color: "#D8709E", name: { tr: "Bayram Harçlığı", en: "Bayram Money" } },
      { key: "family_support", type: "income", emoji: "heart", color: "#D8709E", name: { tr: "Aile Desteği", en: "Family Support" } },
    ],
  },
  {
    key: "refunds_in",
    type: "income",
    emoji: "arrow-uturn-left",
    color: "#7AAE9E",
    name: { tr: "İade & Geri Ödeme", en: "Refunds & Reimbursements" },
  },
  {
    key: "other_income",
    type: "income",
    emoji: "plus-circle",
    color: "#8A8F99",
    name: { tr: "Diğer Gelir", en: "Other Income" },
  },

  // ============ EXPENSE ============
  {
    key: "housing",
    type: "expense",
    kindDefault: "need",
    emoji: "house",
    color: "#8C7A66",
    name: { tr: "Konut", en: "Housing" },
    children: [
      { key: "housing_rent", type: "expense", kindDefault: "need", emoji: "house", color: "#8C7A66", name: { tr: "Kira", en: "Rent" } },
      { key: "housing_aidat", type: "expense", kindDefault: "need", emoji: "building", color: "#8C7A66", name: { tr: "Aidat", en: "HOA" } },
      { key: "housing_mortgage", type: "expense", kindDefault: "need", emoji: "house-key", color: "#8C7A66", name: { tr: "Konut Kredisi Taksiti", en: "Mortgage Payment" } },
      { key: "housing_repair", type: "expense", kindDefault: "need", emoji: "wrench", color: "#8C7A66", name: { tr: "Tadilat & Onarım", en: "Repairs" } },
      { key: "housing_furniture", type: "expense", kindDefault: "want", emoji: "sofa", color: "#8C7A66", name: { tr: "Mobilya & Ev Eşyası", en: "Furniture" } },
    ],
  },
  {
    key: "bills",
    type: "expense",
    kindDefault: "need",
    emoji: "bolt",
    color: "#D6A24E",
    name: { tr: "Faturalar", en: "Bills & Utilities" },
    children: [
      { key: "bill_electric", type: "expense", kindDefault: "need", emoji: "bolt", color: "#D6A24E", name: { tr: "Elektrik", en: "Electricity" } },
      { key: "bill_gas", type: "expense", kindDefault: "need", emoji: "flame", color: "#D6A24E", name: { tr: "Doğalgaz", en: "Natural Gas" } },
      { key: "bill_water", type: "expense", kindDefault: "need", emoji: "droplet", color: "#D6A24E", name: { tr: "Su", en: "Water" } },
      { key: "bill_internet", type: "expense", kindDefault: "need", emoji: "wifi", color: "#D6A24E", name: { tr: "İnternet", en: "Internet" } },
      { key: "bill_mobile", type: "expense", kindDefault: "need", emoji: "phone", color: "#D6A24E", name: { tr: "Telefon", en: "Mobile" } },
    ],
  },
  {
    key: "groceries",
    type: "expense",
    kindDefault: "need",
    emoji: "shopping-cart",
    color: "#5FA85F",
    name: { tr: "Market", en: "Groceries" },
    children: [
      { key: "groc_market", type: "expense", kindDefault: "need", emoji: "shopping-cart", color: "#5FA85F", name: { tr: "Market Alışverişi", en: "Groceries" } },
      { key: "groc_pazar", type: "expense", kindDefault: "need", emoji: "leaf", color: "#5FA85F", name: { tr: "Manav / Pazar", en: "Greengrocer" } },
      { key: "groc_butcher", type: "expense", kindDefault: "need", emoji: "shopping-cart", color: "#5FA85F", name: { tr: "Kasap", en: "Butcher" } },
      { key: "groc_bakery", type: "expense", kindDefault: "need", emoji: "bread", color: "#5FA85F", name: { tr: "Fırın", en: "Bakery" } },
    ],
  },
  {
    key: "dining",
    type: "expense",
    kindDefault: "want",
    emoji: "fork-knife",
    color: "#E08544",
    name: { tr: "Yeme-İçme (Dışarıda)", en: "Dining Out" },
    children: [
      { key: "dining_restaurant", type: "expense", kindDefault: "want", emoji: "fork-knife", color: "#E08544", name: { tr: "Restoran", en: "Restaurant" } },
      { key: "dining_cafe", type: "expense", kindDefault: "want", emoji: "coffee-cup", color: "#E08544", name: { tr: "Kafe & Kahve", en: "Cafe & Coffee" } },
      { key: "dining_delivery", type: "expense", kindDefault: "want", emoji: "scooter", color: "#E08544", name: { tr: "Yemek Sepeti", en: "Food Delivery" } },
      { key: "dining_fastfood", type: "expense", kindDefault: "want", emoji: "burger", color: "#E08544", name: { tr: "Fast Food", en: "Fast Food" } },
    ],
  },
  {
    key: "transport",
    type: "expense",
    kindDefault: "need",
    emoji: "car",
    color: "#3F7AB8",
    name: { tr: "Ulaşım", en: "Transportation" },
    children: [
      { key: "trans_fuel", type: "expense", kindDefault: "need", emoji: "fuel-pump", color: "#3F7AB8", name: { tr: "Yakıt", en: "Fuel" } },
      { key: "trans_transit", type: "expense", kindDefault: "need", emoji: "bus", color: "#3F7AB8", name: { tr: "Toplu Taşıma", en: "Public Transit" } },
      { key: "trans_taxi", type: "expense", kindDefault: "want", emoji: "taxi", color: "#3F7AB8", name: { tr: "Taksi & Çağrı", en: "Taxi & Rideshare" } },
      { key: "trans_parking", type: "expense", kindDefault: "need", emoji: "parking", color: "#3F7AB8", name: { tr: "Otopark", en: "Parking" } },
      { key: "trans_toll", type: "expense", kindDefault: "need", emoji: "road", color: "#3F7AB8", name: { tr: "HGS / Köprü", en: "Toll" } },
      { key: "trans_maintenance", type: "expense", kindDefault: "need", emoji: "wrench", color: "#3F7AB8", name: { tr: "Araç Bakım", en: "Car Maintenance" } },
      { key: "trans_insurance", type: "expense", kindDefault: "need", emoji: "shield-check", color: "#3F7AB8", name: { tr: "Kasko & Trafik", en: "Auto Insurance" } },
      { key: "trans_mtv", type: "expense", kindDefault: "need", emoji: "building-columns", color: "#3F7AB8", name: { tr: "MTV", en: "Vehicle Tax" } },
    ],
  },
  {
    key: "health",
    type: "expense",
    kindDefault: "need",
    emoji: "heart-pulse",
    color: "#D45B6E",
    name: { tr: "Sağlık", en: "Health" },
    children: [
      { key: "health_doctor", type: "expense", kindDefault: "need", emoji: "heart-pulse", color: "#D45B6E", name: { tr: "Doktor", en: "Doctor" } },
      { key: "health_pharmacy", type: "expense", kindDefault: "need", emoji: "pill", color: "#D45B6E", name: { tr: "Eczane", en: "Pharmacy" } },
      { key: "health_dentist", type: "expense", kindDefault: "need", emoji: "tooth", color: "#D45B6E", name: { tr: "Diş Hekimi", en: "Dentist" } },
      { key: "health_insurance", type: "expense", kindDefault: "need", emoji: "shield-check", color: "#D45B6E", name: { tr: "Sağlık Sigortası", en: "Health Insurance" } },
    ],
  },
  {
    key: "education",
    type: "expense",
    kindDefault: "need",
    emoji: "graduation-cap",
    color: "#7C5DC4",
    name: { tr: "Eğitim", en: "Education" },
  },
  {
    key: "entertainment",
    type: "expense",
    kindDefault: "want",
    emoji: "music-note",
    color: "#B85FB0",
    name: { tr: "Eğlence & Hobi", en: "Entertainment & Hobbies" },
    children: [
      { key: "ent_cinema", type: "expense", kindDefault: "want", emoji: "ticket", color: "#B85FB0", name: { tr: "Sinema", en: "Cinema" } },
      { key: "ent_concert", type: "expense", kindDefault: "want", emoji: "music-note", color: "#B85FB0", name: { tr: "Konser", en: "Concerts" } },
      { key: "ent_gaming", type: "expense", kindDefault: "want", emoji: "gamepad", color: "#B85FB0", name: { tr: "Oyun", en: "Gaming" } },
      { key: "ent_books", type: "expense", kindDefault: "want", emoji: "book", color: "#B85FB0", name: { tr: "Kitap", en: "Books" } },
    ],
  },
  {
    key: "personal_care",
    type: "expense",
    kindDefault: "want",
    emoji: "sparkles",
    color: "#D69ABE",
    name: { tr: "Kişisel Bakım", en: "Personal Care" },
    children: [
      { key: "care_hair", type: "expense", kindDefault: "want", emoji: "scissors", color: "#D69ABE", name: { tr: "Kuaför & Berber", en: "Hair Salon" } },
      { key: "care_gym", type: "expense", kindDefault: "want", emoji: "dumbbell", color: "#D69ABE", name: { tr: "Spor Salonu", en: "Gym" } },
      { key: "care_cosmetics", type: "expense", kindDefault: "want", emoji: "sparkles", color: "#D69ABE", name: { tr: "Kozmetik", en: "Cosmetics" } },
    ],
  },
  {
    key: "clothing",
    type: "expense",
    kindDefault: "want",
    emoji: "tshirt",
    color: "#C97A8B",
    name: { tr: "Giyim", en: "Clothing" },
  },
  {
    key: "subscriptions",
    type: "expense",
    kindDefault: "want",
    emoji: "arrows-rotate",
    color: "#5BA8C9",
    name: { tr: "Abonelikler", en: "Subscriptions" },
    children: [
      { key: "sub_streaming", type: "expense", kindDefault: "want", emoji: "tv", color: "#5BA8C9", name: { tr: "Yayın", en: "Streaming" } },
      { key: "sub_music", type: "expense", kindDefault: "want", emoji: "music-note", color: "#5BA8C9", name: { tr: "Müzik", en: "Music" } },
      { key: "sub_software", type: "expense", kindDefault: "want", emoji: "laptop", color: "#5BA8C9", name: { tr: "Yazılım & SaaS", en: "Software & SaaS" } },
      { key: "sub_cloud", type: "expense", kindDefault: "want", emoji: "cloud", color: "#5BA8C9", name: { tr: "Bulut Depolama", en: "Cloud Storage" } },
    ],
  },
  {
    key: "debt",
    type: "expense",
    kindDefault: "need",
    emoji: "credit-card",
    color: "#A45151",
    name: { tr: "Borç & Kredi", en: "Debt & Loans" },
    children: [
      { key: "debt_cc_interest", type: "expense", kindDefault: "need", emoji: "percent", color: "#A45151", name: { tr: "Kart Faizi", en: "Credit Card Interest" } },
      { key: "debt_loan", type: "expense", kindDefault: "need", emoji: "credit-card", color: "#A45151", name: { tr: "Kredi Taksiti", en: "Loan Payment" } },
      { key: "debt_bank_fee", type: "expense", kindDefault: "need", emoji: "building-columns", color: "#A45151", name: { tr: "Banka Masrafı", en: "Bank Fees" } },
    ],
  },
  {
    key: "taxes",
    type: "expense",
    kindDefault: "need",
    emoji: "building-columns",
    color: "#6E7A8A",
    name: { tr: "Vergi & Resmi", en: "Taxes & Government" },
  },
  {
    key: "gifts_out",
    type: "expense",
    kindDefault: "want",
    emoji: "gift",
    color: "#D8709E",
    name: { tr: "Hediye & Bağış", en: "Gifts & Donations" },
    children: [
      { key: "gift_birthday", type: "expense", kindDefault: "want", emoji: "gift", color: "#D8709E", name: { tr: "Doğum Günü", en: "Birthday" } },
      { key: "gift_bayram", type: "expense", kindDefault: "want", emoji: "gift", color: "#D8709E", name: { tr: "Bayram", en: "Bayram" } },
      { key: "gift_donation", type: "expense", kindDefault: "want", emoji: "heart", color: "#D8709E", name: { tr: "Bağış / Sadaka", en: "Donation" } },
    ],
  },
  {
    key: "travel",
    type: "expense",
    kindDefault: "want",
    emoji: "airplane",
    color: "#3FA8A8",
    name: { tr: "Seyahat", en: "Travel" },
  },
  {
    key: "work",
    type: "expense",
    kindDefault: "need",
    emoji: "briefcase",
    color: "#5C6B8A",
    name: { tr: "İş & Ofis", en: "Work & Office" },
  },
  {
    key: "children",
    type: "expense",
    kindDefault: "need",
    emoji: "baby",
    color: "#F2B25C",
    name: { tr: "Çocuk", en: "Children" },
  },
  {
    key: "pets",
    type: "expense",
    kindDefault: "need",
    emoji: "paw",
    color: "#9C7B5E",
    name: { tr: "Evcil Hayvan", en: "Pets" },
  },
  {
    key: "insurance",
    type: "expense",
    kindDefault: "need",
    emoji: "shield-check",
    color: "#6B86A8",
    name: { tr: "Sigorta", en: "Insurance" },
  },
  {
    key: "other_expense",
    type: "expense",
    emoji: "ellipsis-circle",
    color: "#8A8F99",
    name: { tr: "Diğer", en: "Other" },
  },

  // ============ TRANSFER (excluded from reports) ============
  {
    key: "transfer",
    type: "transfer",
    emoji: "arrows-right-left",
    color: "#9AA3AF",
    excludedFromReports: true,
    name: { tr: "Hesaplar Arası Transfer", en: "Account Transfer" },
  },
  {
    key: "cc_payment",
    type: "transfer",
    emoji: "credit-card",
    color: "#9AA3AF",
    excludedFromReports: true,
    name: { tr: "Kredi Kartı Ödemesi", en: "Credit Card Payment" },
  },

  // ============ SAVING / INVESTMENT ============
  {
    key: "savings",
    type: "saving",
    kindDefault: "saving",
    emoji: "piggy-bank",
    color: "#5BA689",
    name: { tr: "Birikim", en: "Savings" },
  },
  {
    key: "investments",
    type: "saving",
    kindDefault: "saving",
    emoji: "chart-up",
    color: "#2FA37C",
    name: { tr: "Yatırım", en: "Investment" },
  },
  {
    key: "gold",
    type: "saving",
    kindDefault: "saving",
    emoji: "coin",
    color: "#D6A24E",
    name: { tr: "Altın", en: "Gold" },
  },
];

// Default starter accounts for new finance users
export interface SeedAccount {
  name: { tr: string; en: string };
  kind: "cash" | "checking";
  currency: string;
  color: string;
  icon: string;
}

export const KASA_SEED_ACCOUNTS: SeedAccount[] = [
  {
    name: { tr: "Nakit", en: "Cash" },
    kind: "cash",
    currency: "TRY",
    color: "#5FA85F",
    icon: "wallet",
  },
];
