-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  total_disposals INTEGER DEFAULT 0,
  bins_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bins table for waste bin locations
CREATE TABLE public.bins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bin_id TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disposals table for waste disposal records
CREATE TABLE public.disposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bin_id UUID NOT NULL REFERENCES public.bins(id),
  waste_type TEXT NOT NULL,
  weight DECIMAL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposals ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for bins (public read access)
CREATE POLICY "Anyone can view bins" 
ON public.bins 
FOR SELECT 
USING (true);

-- Create policies for disposals
CREATE POLICY "Users can view their own disposals" 
ON public.disposals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own disposals" 
ON public.disposals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample bins
INSERT INTO public.bins (bin_id, location, status, latitude, longitude) VALUES
('BIN001', 'Main Campus Library', 'available', 40.7128, -74.0060),
('BIN002', 'Student Center', 'available', 40.7589, -73.9851),
('BIN003', 'Science Building', 'maintenance', 40.7505, -73.9934),
('BIN004', 'Cafeteria Entrance', 'available', 40.7614, -73.9776),
('BIN005', 'Parking Lot A', 'full', 40.7282, -73.7949);