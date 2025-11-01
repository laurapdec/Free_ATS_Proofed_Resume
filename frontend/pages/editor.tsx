import { Box, Container, VStack, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { ContactSection } from '../src/components/ContactSection';
import { ExperienceSection } from '../src/components/ExperienceSection';
import { EducationSection } from '../src/components/EducationSection';
import { PublicationSection } from '../src/components/PublicationSection';
import { SkillsSection } from '../src/components/SkillsSection';
import { LanguageSection } from '../src/components/LanguageSection';
import type { Resume, Experience, Education, Publication, Skill, Language } from '../types/resume';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';

export default function ResumeEditor() {
  const toast = useToast();
  const [resume, setResume] = useState<Resume>({
    contactInfo: {
      email: '',
      phone: '',
      location: {
        city: '',
        country: '',
      },
    },
    experiences: [],
    education: [],
    publications: [],
    skills: [],
    languages: [],
  });

  // Generic update handlers
  const updateContact = (field: keyof typeof resume.contactInfo, value: string) => {
    setResume((prev) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value,
      },
    }));
  };

  type ResumeSection = Experience | Education | Publication | Skill | Language;
  type ResumeSectionKey = Extract<keyof Resume, 'experiences' | 'education' | 'publications' | 'skills' | 'languages'>;
  type SectionToType = {
    experiences: Experience;
    education: Education;
    publications: Publication;
    skills: Skill;
    languages: Language;
  };
  
  const createUpdateHandler = <
    K extends ResumeSectionKey,
    T extends SectionToType[K],
    F extends keyof T
  >(
    section: K,
    field: F
  ) => (id: string, value: string) => {
    setResume((prev) => ({
      ...prev,
      [section]: (prev[section] as T[]).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Add handlers
  const createAddHandler = <
    K extends ResumeSectionKey,
    T extends SectionToType[K]
  >(
    section: K,
    template: Omit<T, 'id'>
  ) => () => {
    setResume((prev) => ({
      ...prev,
      [section]: [...(prev[section] as T[]), { id: uuidv4(), ...template }],
    }));
    toast({
      title: 'Added successfully',
      status: 'success',
      duration: 2000,
    });
  };

  const router = useRouter();

  // Handle LinkedIn data on page load
  useEffect(() => {
    const { profile, error } = router.query;
    
    if (error) {
      toast({
        title: 'Error importing LinkedIn profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    if (profile && typeof profile === 'string') {
      try {
        const linkedInData = JSON.parse(profile);
        setResume(linkedInData);
        toast({
          title: 'LinkedIn profile imported successfully',
          status: 'success',
          duration: 3000,
        });
      } catch (e) {
        console.error('Error parsing LinkedIn data:', e);
      }
    }
  }, [router.query, toast]);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <ContactSection
          contactInfo={resume.contactInfo}
          onUpdate={updateContact}
        />
        <ExperienceSection
          experiences={resume.experiences}
          onUpdate={createUpdateHandler('experiences', 'title')}
          onAdd={createAddHandler('experiences', {
            title: 'New Position',
            company: 'Company Name',
            location: 'Location',
            startDate: 'Start Date',
            endDate: 'Present',
            description: ['Description'],
            skills: [],
          })}
        />
        <EducationSection
          education={resume.education}
          onUpdate={createUpdateHandler('education', 'school')}
          onAdd={createAddHandler('education', {
            school: 'School Name',
            degree: 'Degree',
            field: 'Field of Study',
            startDate: 'Start Date',
            endDate: 'End Date',
          })}
        />
        <PublicationSection
          publications={resume.publications}
          onUpdate={createUpdateHandler('publications', 'title')}
          onAdd={createAddHandler('publications', {
            title: 'Publication Title',
            publisher: 'Publisher',
            date: 'Publication Date',
            authors: ['Author Name'],
          })}
        />
        <SkillsSection
          skills={resume.skills}
          onUpdate={createUpdateHandler('skills', 'name')}
          onAdd={createAddHandler('skills', {
            name: 'Skill Name',
            level: 'Intermediate',
          })}
        />
        <LanguageSection
          languages={resume.languages}
          onUpdate={createUpdateHandler('languages', 'name')}
          onAdd={createAddHandler('languages', {
            name: 'Language Name',
            proficiency: 'Professional Working',
          })}
        />
      </VStack>
    </Container>
  );
}