import type { Resume } from '../types/resume';

export function isValidResume(resume: any): resume is Resume {
  if (!resume || typeof resume !== 'object') return false;
  
  // Check for required top-level properties
  const requiredProps = ['contactInfo', 'experiences', 'education', 'skills', 'languages'];
  if (!requiredProps.every(prop => prop in resume)) return false;
  
  // Validate contactInfo
  if (!resume.contactInfo || typeof resume.contactInfo !== 'object') return false;
  if (!('email' in resume.contactInfo) || !('phone' in resume.contactInfo)) return false;
  if (!('location' in resume.contactInfo) || typeof resume.contactInfo.location !== 'object') return false;
  if (!('city' in resume.contactInfo.location) || !('country' in resume.contactInfo.location)) return false;
  
  // Validate arrays
  const arrayProps = ['experiences', 'education', 'skills', 'languages', 'publications'];
  if (!arrayProps.every(prop => Array.isArray(resume[prop]))) return false;
  
  return true;
}