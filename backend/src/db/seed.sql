-- Allievo Seed Data
-- Demo data for hackathon presentation

-- ============================================================
-- WORKERS (50 mock workers across all 5 cities)
-- ============================================================

INSERT INTO workers (id, name, phone, password_hash, city, platform, zone, declared_weekly_income, years_active, risk_score, risk_label, upi_id, is_active, created_at) VALUES
-- Mumbai workers (10)
('a1000001-0000-0000-0000-000000000001', 'Rajesh Sharma', '9876543210', '$2a$12$dummyhash', 'Mumbai', 'Swiggy', 'Bandra', 5000, '3+', 62, 'Medium', 'rajesh@upi', true, NOW() - INTERVAL '120 days'),
('a1000001-0000-0000-0000-000000000002', 'Priya Deshmukh', '9876543211', '$2a$12$dummyhash', 'Mumbai', 'Zomato', 'Andheri', 3500, '1-3', 55, 'Medium', 'priya@upi', true, NOW() - INTERVAL '90 days'),
('a1000001-0000-0000-0000-000000000003', 'Amit Patil', '9876543212', '$2a$12$dummyhash', 'Mumbai', 'Both', 'Powai', 8000, '3+', 72, 'High', 'amit@upi', true, NOW() - INTERVAL '200 days'),
('a1000001-0000-0000-0000-000000000004', 'Sunita More', '9876543213', '$2a$12$dummyhash', 'Mumbai', 'Swiggy', 'Dadar', 2000, '0-1', 45, 'Medium', 'sunita@upi', true, NOW() - INTERVAL '15 days'),
('a1000001-0000-0000-0000-000000000005', 'Vikram Joshi',  '9876543214', '$2a$12$dummyhash', 'Mumbai', 'Zomato', 'Lower Parel', 5000, '1-3', 58, 'Medium', 'vikram@upi', true, NOW() - INTERVAL '60 days'),
('a1000001-0000-0000-0000-000000000006', 'Meena Kulkarni', '9876543215', '$2a$12$dummyhash', 'Mumbai', 'Both', 'Bandra', 3500, '3+', 38, 'Low', 'meena@upi', true, NOW() - INTERVAL '300 days'),
('a1000001-0000-0000-0000-000000000007', 'Ravi Thakur', '9876543216', '$2a$12$dummyhash', 'Mumbai', 'Swiggy', 'Andheri', 8000, '1-3', 68, 'High', 'ravi@upi', true, NOW() - INTERVAL '45 days'),
('a1000001-0000-0000-0000-000000000008', 'Pooja Sawant', '9876543217', '$2a$12$dummyhash', 'Mumbai', 'Zomato', 'Powai', 2000, '0-1', 52, 'Medium', 'pooja@upi', true, NOW() - INTERVAL '10 days'),
('a1000001-0000-0000-0000-000000000009', 'Suresh Pawar', '9876543218', '$2a$12$dummyhash', 'Mumbai', 'Swiggy', 'Dadar', 5000, '3+', 35, 'Low', 'suresh@upi', true, NOW() - INTERVAL '400 days'),
('a1000001-0000-0000-0000-000000000010', 'Anita Gaikwad', '9876543219', '$2a$12$dummyhash', 'Mumbai', 'Both', 'Lower Parel', 3500, '1-3', 48, 'Medium', 'anita@upi', true, NOW() - INTERVAL '75 days'),

-- Delhi workers (10)
('a1000002-0000-0000-0000-000000000001', 'Arun Kumar', '9876543220', '$2a$12$dummyhash', 'Delhi', 'Swiggy', 'Connaught Place', 5000, '3+', 58, 'Medium', 'arun@upi', true, NOW() - INTERVAL '150 days'),
('a1000002-0000-0000-0000-000000000002', 'Neha Gupta', '9876543221', '$2a$12$dummyhash', 'Delhi', 'Zomato', 'Lajpat Nagar', 3500, '1-3', 50, 'Medium', 'neha@upi', true, NOW() - INTERVAL '80 days'),
('a1000002-0000-0000-0000-000000000003', 'Deepak Verma', '9876543222', '$2a$12$dummyhash', 'Delhi', 'Both', 'Dwarka', 8000, '3+', 65, 'High', 'deepak@upi', true, NOW() - INTERVAL '250 days'),
('a1000002-0000-0000-0000-000000000004', 'Kavita Singh', '9876543223', '$2a$12$dummyhash', 'Delhi', 'Swiggy', 'Saket', 2000, '0-1', 42, 'Medium', 'kavita@upi', true, NOW() - INTERVAL '20 days'),
('a1000002-0000-0000-0000-000000000005', 'Manish Tiwari', '9876543224', '$2a$12$dummyhash', 'Delhi', 'Zomato', 'Noida', 5000, '1-3', 55, 'Medium', 'manish@upi', true, NOW() - INTERVAL '100 days'),
('a1000002-0000-0000-0000-000000000006', 'Sita Yadav', '9876543225', '$2a$12$dummyhash', 'Delhi', 'Both', 'Connaught Place', 3500, '3+', 32, 'Low', 'sita@upi', true, NOW() - INTERVAL '350 days'),
('a1000002-0000-0000-0000-000000000007', 'Rohit Chauhan', '9876543226', '$2a$12$dummyhash', 'Delhi', 'Swiggy', 'Lajpat Nagar', 8000, '1-3', 70, 'High', 'rohit@upi', true, NOW() - INTERVAL '55 days'),
('a1000002-0000-0000-0000-000000000008', 'Geeta Devi', '9876543227', '$2a$12$dummyhash', 'Delhi', 'Zomato', 'Dwarka', 2000, '0-1', 48, 'Medium', 'geeta@upi', true, NOW() - INTERVAL '8 days'),
('a1000002-0000-0000-0000-000000000009', 'Pankaj Mishra', '9876543228', '$2a$12$dummyhash', 'Delhi', 'Swiggy', 'Saket', 5000, '3+', 30, 'Low', 'pankaj@upi', true, NOW() - INTERVAL '420 days'),
('a1000002-0000-0000-0000-000000000010', 'Rekha Jha', '9876543229', '$2a$12$dummyhash', 'Delhi', 'Both', 'Noida', 3500, '1-3', 53, 'Medium', 'rekha@upi', true, NOW() - INTERVAL '95 days'),

-- Bengaluru workers (10)
('a1000003-0000-0000-0000-000000000001', 'Kiran Reddy', '9876543230', '$2a$12$dummyhash', 'Bengaluru', 'Swiggy', 'Koramangala', 5000, '3+', 42, 'Medium', 'kiran@upi', true, NOW() - INTERVAL '180 days'),
('a1000003-0000-0000-0000-000000000002', 'Lakshmi Rao', '9876543231', '$2a$12$dummyhash', 'Bengaluru', 'Zomato', 'Indiranagar', 3500, '1-3', 38, 'Low', 'lakshmi@upi', true, NOW() - INTERVAL '110 days'),
('a1000003-0000-0000-0000-000000000003', 'Ramesh Naidu', '9876543232', '$2a$12$dummyhash', 'Bengaluru', 'Both', 'Whitefield', 8000, '3+', 55, 'Medium', 'ramesh@upi', true, NOW() - INTERVAL '280 days'),
('a1000003-0000-0000-0000-000000000004', 'Asha Kumari', '9876543233', '$2a$12$dummyhash', 'Bengaluru', 'Swiggy', 'Jayanagar', 2000, '0-1', 40, 'Medium', 'asha@upi', true, NOW() - INTERVAL '25 days'),
('a1000003-0000-0000-0000-000000000005', 'Venkatesh S', '9876543234', '$2a$12$dummyhash', 'Bengaluru', 'Zomato', 'HSR Layout', 5000, '1-3', 45, 'Medium', 'venkat@upi', true, NOW() - INTERVAL '130 days'),
('a1000003-0000-0000-0000-000000000006', 'Geetha M', '9876543235', '$2a$12$dummyhash', 'Bengaluru', 'Both', 'Koramangala', 3500, '3+', 28, 'Low', 'geetha@upi', true, NOW() - INTERVAL '380 days'),
('a1000003-0000-0000-0000-000000000007', 'Naveen Kumar', '9876543236', '$2a$12$dummyhash', 'Bengaluru', 'Swiggy', 'Indiranagar', 8000, '1-3', 60, 'Medium', 'naveen@upi', true, NOW() - INTERVAL '65 days'),
('a1000003-0000-0000-0000-000000000008', 'Divya R', '9876543237', '$2a$12$dummyhash', 'Bengaluru', 'Zomato', 'Whitefield', 2000, '0-1', 44, 'Medium', 'divya@upi', true, NOW() - INTERVAL '12 days'),
('a1000003-0000-0000-0000-000000000009', 'Sunil Prasad', '9876543238', '$2a$12$dummyhash', 'Bengaluru', 'Swiggy', 'Jayanagar', 5000, '3+', 25, 'Low', 'sunil@upi', true, NOW() - INTERVAL '450 days'),
('a1000003-0000-0000-0000-000000000010', 'Padma K', '9876543239', '$2a$12$dummyhash', 'Bengaluru', 'Both', 'HSR Layout', 3500, '1-3', 50, 'Medium', 'padma@upi', true, NOW() - INTERVAL '85 days'),

-- Chennai workers (10)
('a1000004-0000-0000-0000-000000000001', 'Muthu Kumar', '9876543240', '$2a$12$dummyhash', 'Chennai', 'Swiggy', 'T. Nagar', 5000, '3+', 61, 'Medium', 'muthu@upi', true, NOW() - INTERVAL '170 days'),
('a1000004-0000-0000-0000-000000000002', 'Selvi R', '9876543241', '$2a$12$dummyhash', 'Chennai', 'Zomato', 'Anna Nagar', 3500, '1-3', 48, 'Medium', 'selvi@upi', true, NOW() - INTERVAL '95 days'),
('a1000004-0000-0000-0000-000000000003', 'Senthil Nathan', '9876543242', '$2a$12$dummyhash', 'Chennai', 'Both', 'Velachery', 8000, '3+', 70, 'High', 'senthil@upi', true, NOW() - INTERVAL '260 days'),
('a1000004-0000-0000-0000-000000000004', 'Revathi S', '9876543243', '$2a$12$dummyhash', 'Chennai', 'Swiggy', 'Adyar', 2000, '0-1', 43, 'Medium', 'revathi@upi', true, NOW() - INTERVAL '18 days'),
('a1000004-0000-0000-0000-000000000005', 'Arjun P', '9876543244', '$2a$12$dummyhash', 'Chennai', 'Zomato', 'Mylapore', 5000, '1-3', 56, 'Medium', 'arjun@upi', true, NOW() - INTERVAL '105 days'),
('a1000004-0000-0000-0000-000000000006', 'Bhavani K', '9876543245', '$2a$12$dummyhash', 'Chennai', 'Both', 'T. Nagar', 3500, '3+', 34, 'Low', 'bhavani@upi', true, NOW() - INTERVAL '320 days'),
('a1000004-0000-0000-0000-000000000007', 'Vijay Kumar', '9876543246', '$2a$12$dummyhash', 'Chennai', 'Swiggy', 'Anna Nagar', 8000, '1-3', 66, 'High', 'vijay@upi', true, NOW() - INTERVAL '50 days'),
('a1000004-0000-0000-0000-000000000008', 'Devi M', '9876543247', '$2a$12$dummyhash', 'Chennai', 'Zomato', 'Velachery', 2000, '0-1', 47, 'Medium', 'devi@upi', true, NOW() - INTERVAL '9 days'),
('a1000004-0000-0000-0000-000000000009', 'Manikandan S', '9876543248', '$2a$12$dummyhash', 'Chennai', 'Swiggy', 'Adyar', 5000, '3+', 29, 'Low', 'mani@upi', true, NOW() - INTERVAL '430 days'),
('a1000004-0000-0000-0000-000000000010', 'Tamil Selvi', '9876543249', '$2a$12$dummyhash', 'Chennai', 'Both', 'Mylapore', 3500, '1-3', 51, 'Medium', 'tamil@upi', true, NOW() - INTERVAL '88 days'),

-- Hyderabad workers (10)
('a1000005-0000-0000-0000-000000000001', 'Ravi Shankar', '9876543250', '$2a$12$dummyhash', 'Hyderabad', 'Swiggy', 'Kondapur', 5000, '3+', 48, 'Medium', 'ravis@upi', true, NOW() - INTERVAL '160 days'),
('a1000005-0000-0000-0000-000000000002', 'Swathi Reddy', '9876543251', '$2a$12$dummyhash', 'Hyderabad', 'Zomato', 'Gachibowli', 3500, '1-3', 42, 'Medium', 'swathi@upi', true, NOW() - INTERVAL '100 days'),
('a1000005-0000-0000-0000-000000000003', 'Prasad Rao', '9876543252', '$2a$12$dummyhash', 'Hyderabad', 'Both', 'Banjara Hills', 8000, '3+', 58, 'Medium', 'prasad@upi', true, NOW() - INTERVAL '270 days'),
('a1000005-0000-0000-0000-000000000004', 'Lavanya K', '9876543253', '$2a$12$dummyhash', 'Hyderabad', 'Swiggy', 'Hitech City', 2000, '0-1', 39, 'Low', 'lavanya@upi', true, NOW() - INTERVAL '22 days'),
('a1000005-0000-0000-0000-000000000005', 'Srinivas M', '9876543254', '$2a$12$dummyhash', 'Hyderabad', 'Zomato', 'Kukatpally', 5000, '1-3', 46, 'Medium', 'srinivas@upi', true, NOW() - INTERVAL '115 days'),
('a1000005-0000-0000-0000-000000000006', 'Jyothi B', '9876543255', '$2a$12$dummyhash', 'Hyderabad', 'Both', 'Kondapur', 3500, '3+', 30, 'Low', 'jyothi@upi', true, NOW() - INTERVAL '340 days'),
('a1000005-0000-0000-0000-000000000007', 'Venu Gopal', '9876543256', '$2a$12$dummyhash', 'Hyderabad', 'Swiggy', 'Gachibowli', 8000, '1-3', 63, 'Medium', 'venu@upi', true, NOW() - INTERVAL '58 days'),
('a1000005-0000-0000-0000-000000000008', 'Keerthi S', '9876543257', '$2a$12$dummyhash', 'Hyderabad', 'Zomato', 'Banjara Hills', 2000, '0-1', 41, 'Medium', 'keerthi@upi', true, NOW() - INTERVAL '11 days'),
('a1000005-0000-0000-0000-000000000009', 'Naresh Kumar', '9876543258', '$2a$12$dummyhash', 'Hyderabad', 'Swiggy', 'Hitech City', 5000, '3+', 27, 'Low', 'naresh@upi', true, NOW() - INTERVAL '440 days'),
('a1000005-0000-0000-0000-000000000010', 'Madhavi L', '9876543259', '$2a$12$dummyhash', 'Hyderabad', 'Both', 'Kukatpally', 3500, '1-3', 49, 'Medium', 'madhavi@upi', true, NOW() - INTERVAL '82 days');

-- Note: In production, password_hash would be proper bcrypt hashes.
-- For seed data we use placeholder hashes. Real auth uses the register endpoint.

-- Policies and claims would be generated programmatically for the 1247/744 counts.
-- The demo app uses in-memory stores that return realistic mock numbers 
-- via the admin stats endpoint when no database data exists.
