/** Response shapes of the Express API (kept in sync by hand: two separate repos). */

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };
export type Paginated<T> = { data: T[]; meta: PageMeta };
export type Single<T> = { data: T };

export type Condition = 'stable' | 'recovering' | 'critical' | 'discharged';
export type Gender = 'male' | 'female' | 'other';
export type SortOption = 'newest' | 'oldest' | 'name';

export type Me = { id: string; name: string; email: string; role: 'admin' | 'staff' };

export type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  patientCount: number;
};

export type DoctorRef = Pick<Doctor, '_id' | 'name' | 'specialization' | 'hospital'>;

export type Patient = {
  _id: string;
  name: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  condition: Condition;
  diagnosis?: string;
  doctor: DoctorRef;
  admittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Options = {
  specializations: string[];
  hospitals: string[];
  conditions: Condition[];
  genders: Gender[];
};

export type Overview = {
  totalDoctors: number;
  totalPatients: number;
  criticalPatients: number;
  newPatientsThisMonth: number;
  avgPatientsPerDoctor: number;
  patientsByCondition: { condition: Condition; count: number }[];
  topDoctors: { doctorId: string; name: string; specialization: string; count: number }[];
  doctorsBySpecialization: { specialization: string; count: number }[];
  patientsOverTime: { unit: 'day' | 'month'; points: { date: string; count: number }[] };
};
