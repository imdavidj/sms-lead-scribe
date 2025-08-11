-- Insert a test lead to see if the UI displays hot/warm/cold tags properly
INSERT INTO public.leads (phone, ai_tag, ai_classification_reason, status, first_name, last_name, email) 
VALUES 
  ('+14804947157', 'hot', 'Interested in selling property', 'No Response', 'John', 'Doe', 'john@example.com'),
  ('+15551234567', 'warm', 'Considering options', 'No Response', 'Jane', 'Smith', 'jane@example.com'),
  ('+15559876543', 'cold', 'Not interested currently', 'No Response', 'Bob', 'Johnson', 'bob@example.com');