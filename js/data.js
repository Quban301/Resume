/* 
   All site content lives here. Edit this file to add projects,
   jobs, skills or certifications — no HTML changes needed.

   Project fields :
     title, tagline, description, stack[], category, year, featured
     links: { live: "https://…", repo: "https://github.com/…" }  (optional)
     accent: [colorA, colorB]  — gradient used for the card art
 */

window.SITE = {
  githubUser: "Quban301",
  email: "Qhawemoyo1@gmail.com",

  roles: [
    "scalable REST APIs",
    "full-stack web platforms",
    "Mobile apps",
    "RAG & LLM-powered features",
    "CI/CD pipelines that just work",
    "modern replacements for legacy systems",
    "AI integrations"
  ],

  projects: [
    {
      title: "Proctor System",
      tagline: "Exam proctoring platform",
      description: "Built a substantial portion of an online proctoring system used to run and supervise assessments for learners at WWISE.",
      stack: ["Web", "Backend", "Databases"],
      category: "Web",
      year: "2026",
      accent: ["#1f9d55", "#a3e635"]
    },
    {
      title: "GTICS Website",
      tagline: "Social media integration platform",
      description: "Aggregates and displays content from multiple third-party social APIs into a single, unified experience.",
      stack: ["REST APIs", "OAuth", "Integrations"],
      category: "Integration",
      year: "2026",
      links: {live: "https://www.gtics.co.za/"},
      accent: ["#3f6212", "#bef264"]
    },
    {
      title: "WWISE Academy LMS",
      tagline: "Learning management system",
      description: "Now project owner of the LMS. Built a course preview so learners can read a module or two before committing to a purchase, redesigned the test-taking UI, and streamlined how content is uploaded.",
      stack: ["Web", "UX", "UI", "Content pipeline", "LMS"],
      category: "Web",
      year: "2026",
      links: {live: "https://wwiseacademy.com/Home"},
      // featured: true,
      accent: ["#15803d", "#4ade80"]
    },
    {
      title: "Android eLearning App + CMS",
      tagline: "Mobile learning & content management",
      description: "Led development of an Android eLearning platform and its supporting CMS at Hawk Mobile, backed by Laravel/PHP REST APIs and CI/CD pipelines.",
      stack: ["Java", "Android", "Laravel", "PHP", "CI/CD"],
      category: "Mobile",
      year: "2025",
      links: {live: "https://play.google.com/store/apps/details?id=com.hawkmobile.pedrosacademy&hl=en-US"},
      accent: ["#166534", "#d9a441"]
    },
    {
      title: "RAG / LLM Pipelines",
      tagline: "Retrieval-augmented generation",
      description: "Contributed to RAG pipelines that bring data retrieval and contextual generation into existing production systems.",
      stack: ["LLM", "RAG", "Python", "APIs"],
      category: "AI",
      year: "2021",
      accent: ["#0d9488", "#a7f3d0"]
    },
    {
      title: "Operational, Finance & Analytics APIs",
      tagline: "API-driven business workflows",
      description: "Designed and delivered API-driven solutions for operational, financial and analytics workflows, with attention to database design and performance.",
      stack: ["Laravel", "REST", "SQL", "Optimization"],
      category: "Backend",
      year: "2025",
      accent: ["#4d7c0f", "#84cc16"]
    },
    {
      title: "Legacy Modernization",
      tagline: "Refactors that pay off",
      description: "Refactored legacy codebases and introduced CI/CD to streamline testing and deployments, cutting release friction.",
      stack: ["PHP", "Refactoring", "CI/CD", "Git"],
      category: "Backend",
      year: "2025",
      accent: ["#78350f", "#a3b18a"]
    },
    {
      title: "Security Hardening",
      tagline: "Firewalls, encryption, best practice",
      description: "Identified gaps in security practices at L&M Media Group and implemented firewalls and encryption, reducing vulnerabilities by 30%.",
      stack: ["Cybersecurity", "Encryption", "Networking"],
      category: "Security",
      year: "2021-24",
      accent: ["#14532d", "#d4a373"]
    },
  ],

  experience: [
    {
      date: "Feb 2026 - Present",
      role: "Facilitator & Software Developer",
      company: "World Wide Industrial & Systems Engineers",
      place: "Johannesburg, Gauteng",
      points: [
        "Built the WWISE Proctor system plus a testing platform for AWS Cloud Practitioner and Microsoft SC-900 prep.",
        "Became project owner: built demo code that lets learners read a module or two before buying a course and revamped the UI for tests",
        "Built a social-media integration platform for GTICS aggregating multiple third-party APIs.",
        "Built the database and linking for certifications and verifying certicates from a business POV.",
        "Facilitated software development training for large learner cohorts with practical, workplace-focused exercises."
      ],
      tags: ["Leadership", "AWS", "Azure", "APIs", "Training"]
    },
    {
      date: "Aug 2025 - Dec 2025",
      role: "Senior Software Developer",
      company: "Hawk Mobile",
      place: "Durban, KwaZulu-Natal",
      points: [
        "Designed, developed and modernized scalable web, mobile and backend systems.",
        "Built Laravel/PHP REST APIs, refactored legacy code and implemented CI/CD pipelines for testing and deployment.",
        "Led an Android eLearning platform and supporting CMS; shipped API solutions for operational, financial and analytics workflows.",
        "Contributed to RAG/LLM pipelines and AI-enabled apps, and drove engineering best practices across projects."
      ],
      tags: ["Laravel", "Java", "CI/CD", "RAG", "Architecture"]
    },
    {
      date: "Jan 2025 - Jul 2025",
      role: "IT Technician",
      company: "KZN Office of the Premier",
      place: "Durban, KwaZulu-Natal",
      points: [
        "Primary point of contact for hardware, software, networking and digital-system issues in a government office.",
        "Supported staff with technology adoption and the rollout of digital tools; contributed to research and admin initiatives."
      ],
      tags: ["Support", "Networking", "Adoption"]
    },
    {
      date: "Apr 2021 - Dec 2024",
      role: "Software Developer",
      company: "L&M Media Group",
      place: "Durban, KwaZulu-Natal",
      points: [
        "Designed and maintained web and mobile solutions; built backend services, APIs, databases and third-party integrations.",
        "Resolved hardware/software issues with a 95% success rate within 24 hours.",
        "Implemented firewalls, encryption and security best practice... vulnerabilities down 30%.",
        "Client training and support lifted application adoption by 25%; led a team of five developers to meet tight deadlines."
      ],
      tags: ["PHP", "ASP.NET", "SQL", "Security"]
    },
    {
      date: "Jun 2019 - Jan 2021",
      role: "Software Developer",
      company: "Freelance",
      place: "Remote",
      points: [
        "Delivered custom web and mobile solutions end-to-end: requirements, build, deployment and maintenance.",
        "Worked directly with stakeholders to translate business needs into shipped products."
      ],
      tags: ["Full-stack", "Mobile", "Clients"]
    }
  ],

  skills: [
    { name: "Languages", icon: "{ }", span: 2, items: ["Python", "PHP", "C#", "Java", "JavaScript", "Kotlin", "SQL", "HTML", "CSS"] },
    { name: "Frameworks & Libraries", icon: "⚙", span: 2, items: ["Laravel", "ASP.NET Core", "React", "Angular", "Node.js", "UI5", "Bootstrap", "TensorFlow"] },
    { name: "Cloud & DevOps", icon: "☁", span: 1, items: ["Azure", "AWS", "CI/CD", "Linux", "Git"] },
    { name: "Databases", icon: "◍", span: 1, items: ["MS SQL Server", "MySQL", "SQLite"] },
    { name: "AI & Data", icon: "✦", span: 2, items: ["RAG", "LLM Integration", "Machine Learning", "Deep Learning", "TensorFlow"] },
    { name: "Mobile", icon: "▯", span: 1, items: ["Android", "Java", "Android Studio"] },
    { name: "Other", icon: "◈", span: 1, items: ["REST APIs", "API Integration", "Cybersecurity", "System Integration"] }
  ],

  // Each group becomes a main branch of the competency tree; each item a twig.
  competencies: [
    { group: "Front & Mobile", items: ["Web Application Development", "Full-Stack Development", "React", "Android / Java"] },
    { group: "Backend & APIs", items: ["Software Architecture", "RESTful API Design & Integration", "Laravel / PHP", "ASP.NET Core", "Database Design & Optimization"] },
    { group: "Cloud & DevOps", items: ["CI/CD & DevOps", "Cloud Computing", "System Integration", "Performance Optimization"] },
    { group: "AI", items: ["AI / LLM Integration", "RAG Pipelines"] },
    { group: "Craft & Leadership", items: ["Legacy Modernization", "Code Review & Mentorship", "Agile Development", "Product Ownership"] }
  ],

  // The guestbook. By default notes are saved in the visitor's own browser. For a shared,
  // moderated guestbook, set the Firebase Realtime Database URL below (see README for the
  // full setup and the database rules). New notes arrive hidden (ok: false) and the author
  // sees theirs as "awaiting approval". Approve, edit or deny them at /guestbook/ (the
  // moderation page), which signs in with a Firebase email/password user. apiKey is the
  // project's public Web API key (Project settings > General); it is safe to publish.
  guestbook: { 
    endpoint: "https://guestbook-quban-default-rtdb.firebaseio.com/", 
    apiKey: "AIzaSyBQ-YmbpKLyR5pFP77MRPzCKHOp4KNjXUw" },

  certifications: [
    "Cloud DevOps (Intel)", "PHP Master Class (Udemy)", "Data Classification & Summarization with IBM Granite",
    "Python Essentials 2", "Cybersecurity Essentials (Cisco)", "JavaScript Essentials 2",
    "Junior Cybersecurity Analyst Career Path", "Artificial Intelligence Fundamentals (IBM)"
  ]
};
