-- Add 'disc' to the allowed test types in assessments table
ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS assessments_test_type_check;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_test_type_check CHECK (test_type IN (
    'seniority_seller', 
    'seniority_leader', 
    'def_method', 
    'values_8d', 
    'leadership_style',
    'disc'
));

-- Add 'disc' to the allowed test types in test_structures table
ALTER TABLE public.test_structures DROP CONSTRAINT IF EXISTS test_structures_test_type_check;
ALTER TABLE public.test_structures ADD CONSTRAINT test_structures_test_type_check CHECK (test_type IN (
    'seniority_seller', 
    'seniority_leader', 
    'def_method', 
    'values_8d', 
    'leadership_style',
    'disc'
));
