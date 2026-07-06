export type Mentor = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  company: string;
  companySlug: string;
  experience: number;
  location: string;
  languages: string[];
  bio: string;
  skills: string[];
  rating: number;
  reviews: number;
  sessions: number;
  pricePerSession: number;
  responseTime: string;
  available: boolean;
  services: { id: string; title: string; duration: string; price: number; type: string }[];
  journey: { year: string; title: string; company: string; description: string }[];
  achievements: string[];
  certifications: string[];
  testimonials: { name: string; role: string; text: string; rating: number }[];
  faqs: { q: string; a: string }[];
};

const make = (m: Mentor) => m;

export const mentors: Mentor[] = [
  make({
    id: "aarav-mehta",
    name: "Aarav Mehta",
    initials: "AM",
    avatarColor: "#2563EB",
    role: "Senior Software Engineer",
    company: "Google",
    companySlug: "google",
    experience: 7,
    location: "Bengaluru, India",
    languages: ["English", "Hindi"],
    bio: "I help engineers crack FAANG interviews. Ex-Microsoft, now at Google working on Search infrastructure. I've coached 300+ candidates with a 78% offer rate.",
    skills: ["DSA", "System Design", "Distributed Systems", "Go", "Python", "Behavioral"],
    rating: 4.9,
    reviews: 184,
    sessions: 412,
    pricePerSession: 49,
    responseTime: "Within 2 hours",
    available: true,
    services: [
      { id: "mock-coding", title: "Mock Coding Interview", duration: "60 min", price: 49, type: "Video Call" },
      { id: "system-design", title: "System Design Deep Dive", duration: "75 min", price: 79, type: "Video Call" },
      { id: "resume-review", title: "FAANG Resume Review", duration: "30 min", price: 29, type: "Document Review" },
      { id: "referral", title: "Google Referral Guidance", duration: "45 min", price: 99, type: "Video Call" },
    ],
    journey: [
      { year: "2024", title: "Senior SWE", company: "Google", description: "Leading a 6-person team on Search ranking." },
      { year: "2021", title: "SWE II", company: "Google", description: "Joined Search infra team after L4 transfer." },
      { year: "2018", title: "SDE II", company: "Microsoft", description: "Azure storage, 3-year tenure." },
      { year: "2017", title: "B.Tech CSE", company: "IIT Bombay", description: "Graduated with Dean's list honors." },
    ],
    achievements: ["Google Spot Bonus x3", "ICPC Regionalist 2016", "Tech speaker at GopherCon India 2023"],
    certifications: ["AWS Solutions Architect", "Google Cloud Professional"],
    testimonials: [
      { name: "Priya R.", role: "SDE @ Amazon", text: "Aarav's mock interviews felt harder than the real thing. Landed the offer in 4 weeks.", rating: 5 },
      { name: "Karthik S.", role: "SWE @ Stripe", text: "Best system design coaching I've had. Worth every dollar.", rating: 5 },
    ],
    faqs: [
      { q: "Do you guarantee a referral?", a: "I guarantee an honest assessment. Referrals depend on team fit and your readiness — I won't refer someone who isn't ready." },
      { q: "Do you cover frontend?", a: "Backend and infra are my strengths. For frontend, I'd recommend Sofia or Daniel." },
    ],
  }),
  make({
    id: "sofia-park",
    name: "Sofia Park",
    initials: "SP",
    avatarColor: "#10B981",
    role: "Staff Frontend Engineer",
    company: "Meta",
    companySlug: "meta",
    experience: 9,
    location: "London, UK",
    languages: ["English", "Korean"],
    bio: "Staff engineer on Instagram Web. I help frontend engineers level up — React internals, performance, and the product architecture interview.",
    skills: ["React", "TypeScript", "Performance", "Product Architecture", "GraphQL"],
    rating: 5.0,
    reviews: 142,
    sessions: 268,
    pricePerSession: 89,
    responseTime: "Within 4 hours",
    available: true,
    services: [
      { id: "product-arch", title: "Meta Product Architecture Mock", duration: "60 min", price: 89, type: "Video Call" },
      { id: "fe-deep", title: "Frontend Deep Dive", duration: "60 min", price: 79, type: "Video Call" },
      { id: "career-plan", title: "Senior to Staff Roadmap", duration: "45 min", price: 99, type: "Video Call" },
    ],
    journey: [
      { year: "2023", title: "Staff Engineer", company: "Meta", description: "Promoted to E6 after leading Reels web rewrite." },
      { year: "2019", title: "Senior SWE", company: "Meta", description: "Joined Instagram Web." },
      { year: "2016", title: "Frontend Engineer", company: "Airbnb", description: "Search and discovery." },
    ],
    achievements: ["Meta Above & Beyond Award 2023", "Author of `react-island` (4k stars)"],
    certifications: [],
    testimonials: [
      { name: "James T.", role: "FE @ Shopify", text: "Sofia explained Meta's product arch rubric better than anyone.", rating: 5 },
    ],
    faqs: [{ q: "US timezone OK?", a: "I take 2 evening UK slots that work for PT mornings." }],
  }),
  make({
    id: "daniel-okafor",
    name: "Daniel Okafor",
    initials: "DO",
    avatarColor: "#F59E0B",
    role: "Senior Product Manager",
    company: "Amazon",
    companySlug: "amazon",
    experience: 8,
    location: "Seattle, WA",
    languages: ["English"],
    bio: "PM at Amazon Devices. I help PMs and engineers transitioning to product. Specialty: Amazon LP storytelling and product sense.",
    skills: ["Product Sense", "LP Stories", "Strategy", "Analytics"],
    rating: 4.8,
    reviews: 96,
    sessions: 178,
    pricePerSession: 119,
    responseTime: "Within 1 day",
    available: true,
    services: [
      { id: "pm-mock", title: "Amazon PM Loop Mock", duration: "60 min", price: 119, type: "Video Call" },
      { id: "lp-stories", title: "Leadership Principles Story Workshop", duration: "60 min", price: 99, type: "Video Call" },
    ],
    journey: [
      { year: "2022", title: "Senior PM", company: "Amazon", description: "Echo Show roadmap owner." },
      { year: "2019", title: "PM", company: "Amazon", description: "Joined as L5 PM." },
      { year: "2016", title: "Consultant", company: "McKinsey", description: "TMT practice." },
    ],
    achievements: ["Amazon Door Desk Award", "Wharton MBA"],
    certifications: [],
    testimonials: [{ name: "Mei L.", role: "APM @ Amazon", text: "Daniel rebuilt my LP stories from scratch. Got the offer.", rating: 5 }],
    faqs: [{ q: "Engineer to PM transition?", a: "Yes — I've coached 40+ engineers through it." }],
  }),
  make({
    id: "isha-verma",
    name: "Isha Verma",
    initials: "IV",
    avatarColor: "#8B5CF6",
    role: "Data Scientist",
    company: "Microsoft",
    companySlug: "microsoft",
    experience: 6,
    location: "Hyderabad, India",
    languages: ["English", "Hindi", "Telugu"],
    bio: "DS on Microsoft Copilot. SQL, stats, ML system design, and case studies — I make data interviews structured and learnable.",
    skills: ["SQL", "ML", "Statistics", "Python", "Case Study"],
    rating: 4.9,
    reviews: 73,
    sessions: 134,
    pricePerSession: 59,
    responseTime: "Within 6 hours",
    available: true,
    services: [
      { id: "sql-mock", title: "SQL & Case Mock", duration: "60 min", price: 59, type: "Video Call" },
      { id: "ml-design", title: "ML System Design", duration: "75 min", price: 89, type: "Video Call" },
    ],
    journey: [
      { year: "2023", title: "DS II", company: "Microsoft", description: "Copilot evaluation pipelines." },
      { year: "2020", title: "DS I", company: "Microsoft", description: "Bing relevance." },
    ],
    achievements: ["Kaggle Expert", "MS Stats — Stanford"],
    certifications: ["Microsoft Certified: Azure Data Scientist"],
    testimonials: [{ name: "Rahul D.", role: "DS @ Walmart Labs", text: "Isha's SQL drills were brutal in the best way.", rating: 5 }],
    faqs: [{ q: "Career switch from analyst?", a: "Yes — most of my mentees come from analytics roles." }],
  }),
  make({
    id: "luca-romano",
    name: "Luca Romano",
    initials: "LR",
    avatarColor: "#EF4444",
    role: "DevOps Lead",
    company: "Adobe",
    companySlug: "adobe",
    experience: 10,
    location: "Milan, Italy",
    languages: ["English", "Italian"],
    bio: "DevOps lead on Experience Cloud. K8s, Terraform, observability, and SRE interview prep.",
    skills: ["Kubernetes", "Terraform", "AWS", "SRE", "Observability"],
    rating: 4.8,
    reviews: 58,
    sessions: 121,
    pricePerSession: 69,
    responseTime: "Within 3 hours",
    available: false,
    services: [
      { id: "sre-mock", title: "SRE Interview Mock", duration: "60 min", price: 69, type: "Video Call" },
      { id: "k8s-coach", title: "Kubernetes Production Coaching", duration: "60 min", price: 79, type: "Video Call" },
    ],
    journey: [
      { year: "2021", title: "DevOps Lead", company: "Adobe", description: "Multi-region platform team." },
      { year: "2017", title: "SRE", company: "Booking.com", description: "Search infra reliability." },
    ],
    achievements: ["CNCF Ambassador 2022", "KubeCon EU speaker"],
    certifications: ["CKA", "CKAD", "AWS DevOps Pro"],
    testimonials: [{ name: "Anna P.", role: "SRE @ Datadog", text: "Luca's K8s debugging walkthroughs were gold.", rating: 5 }],
    faqs: [{ q: "Currently waitlisted?", a: "Yes — opening 5 slots next month." }],
  }),
  make({
    id: "noah-bennett",
    name: "Noah Bennett",
    initials: "NB",
    avatarColor: "#06B6D4",
    role: "Senior Backend Engineer",
    company: "Uber",
    companySlug: "uber",
    experience: 7,
    location: "Amsterdam, NL",
    languages: ["English", "Dutch"],
    bio: "Backend on Uber Eats. I focus on Go, distributed systems, and real-time architecture interviews.",
    skills: ["Go", "Distributed Systems", "Kafka", "Postgres", "Realtime"],
    rating: 4.9,
    reviews: 87,
    sessions: 192,
    pricePerSession: 65,
    responseTime: "Within 4 hours",
    available: true,
    services: [
      { id: "go-mock", title: "Go Coding Mock", duration: "60 min", price: 65, type: "Video Call" },
      { id: "rt-design", title: "Realtime System Design", duration: "75 min", price: 85, type: "Video Call" },
    ],
    journey: [
      { year: "2022", title: "Sr Engineer", company: "Uber", description: "Eats delivery dispatch." },
      { year: "2018", title: "Engineer", company: "Booking.com", description: "Payments platform." },
    ],
    achievements: ["Uber Engineering Excellence 2023"],
    certifications: [],
    testimonials: [{ name: "Tom V.", role: "SWE @ Bolt", text: "Noah's dispatch system walkthrough was the best I've seen.", rating: 5 }],
    faqs: [],
  }),
  make({
    id: "mira-haq",
    name: "Mira Haq",
    initials: "MH",
    avatarColor: "#EC4899",
    role: "Engineering Manager",
    company: "Netflix",
    companySlug: "netflix",
    experience: 12,
    location: "Los Angeles, CA",
    languages: ["English", "Urdu"],
    bio: "EM at Netflix Studio Engineering. I coach senior+ engineers on EM transition, scope, and behavioral storytelling.",
    skills: ["EM Interview", "Behavioral", "Org Design", "Scope"],
    rating: 5.0,
    reviews: 64,
    sessions: 98,
    pricePerSession: 149,
    responseTime: "Within 1 day",
    available: true,
    services: [
      { id: "em-mock", title: "EM Behavioral Loop", duration: "60 min", price: 149, type: "Video Call" },
      { id: "em-transition", title: "Senior → EM Roadmap", duration: "60 min", price: 129, type: "Video Call" },
    ],
    journey: [
      { year: "2022", title: "EM", company: "Netflix", description: "Studio engineering, 8 reports." },
      { year: "2018", title: "Senior EM", company: "Hulu", description: "Playback team." },
    ],
    achievements: ["Speaker, LeadDev NYC 2024"],
    certifications: [],
    testimonials: [{ name: "Raj B.", role: "EM @ Disney+", text: "Mira's coaching is calm, sharp, and decisive.", rating: 5 }],
    faqs: [],
  }),
  make({
    id: "kenji-tanaka",
    name: "Kenji Tanaka",
    initials: "KT",
    avatarColor: "#0EA5E9",
    role: "iOS Engineer",
    company: "Flipkart",
    companySlug: "flipkart",
    experience: 5,
    location: "Bengaluru, India",
    languages: ["English", "Japanese"],
    bio: "iOS engineer on the Flipkart app. Swift, architecture, and machine coding rounds for Indian product companies.",
    skills: ["Swift", "iOS", "Architecture", "Machine Coding"],
    rating: 4.7,
    reviews: 49,
    sessions: 88,
    pricePerSession: 39,
    responseTime: "Within 6 hours",
    available: true,
    services: [
      { id: "ios-mock", title: "iOS Machine Coding", duration: "90 min", price: 49, type: "Video Call" },
      { id: "ios-arch", title: "iOS Architecture Deep Dive", duration: "60 min", price: 39, type: "Video Call" },
    ],
    journey: [
      { year: "2022", title: "iOS Eng", company: "Flipkart", description: "Checkout experience." },
      { year: "2020", title: "iOS Eng", company: "Swiggy", description: "Order tracking." },
    ],
    achievements: ["Flipkart Excellence Award"],
    certifications: [],
    testimonials: [{ name: "Sai K.", role: "iOS @ Zomato", text: "Kenji broke down MVVM-C in a way that finally clicked.", rating: 5 }],
    faqs: [],
  }),
];

export const getMentor = (id: string) => mentors.find((m) => m.id === id);
