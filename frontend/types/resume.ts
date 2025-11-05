export interface ContactInfo {
  email: string;
  phone: string;
  location: {
    city: string;
    country: string;
    state?: string;
  };
  linkedin?: string;
  website?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | 'Present';
  description: string[];
  skills: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: number;
  activities?: string[];
}

export interface Publication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  authors: string[];
  url?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  endorsements?: number;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'Elementary' | 'Limited Working' | 'Professional Working' | 'Full Professional' | 'Native/Bilingual';
}

export interface ResumeFile {
  url: string;
  name: string;
  lastModified: string;
  status: 'generating' | 'ready' | 'error';
}

export interface Resume {
  contactInfo: ContactInfo;
  experiences: Experience[];
  education: Education[];
  publications: Publication[];
  skills: Skill[];
  languages: Language[];
  pdfFile?: ResumeFile;
}