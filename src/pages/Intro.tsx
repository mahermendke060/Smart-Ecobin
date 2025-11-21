import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Recycle, Leaf, Sparkles, Shield, Trophy } from 'lucide-react';
import heroImage from '@/assets/hero-ecobin.png';
import smartBinImg from '@/assets/smart-bin.svg';
import scanningImg from '@/assets/scanning.svg';
import sortingImg from '@/assets/sorting.svg';
import rewardsImg from '@/assets/rewards.svg';
import scanPhoto from '@/assets/scan.jpg.png';
import disposePhoto from '@/assets/dispose.jpg';
import earnPhoto from '@/assets/earn.jpg';

const Intro = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden font-inter">
      {/* Refined eco gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_-10%_-10%,#B6F7C8_10%,transparent_60%),radial-gradient(1200px_600px_at_110%_110%,#6ED6A0_10%,transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#B6F7C8] via-[#6ED6A0] to-[#2FA56F] opacity-70" />

      {/* subtle waves/leaves illustration */}
      <svg className="absolute -right-20 -top-20 w-[700px] h-[700px] opacity-20" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M300 50C200 120 80 100 40 230c-40 130 70 210 160 250 120 55 260 40 320-60s-10-220-120-290C360 90 330 70 300 50z" fill="#ffffff" />
      </svg>
      <svg className="absolute -left-24 -bottom-24 w-[520px] h-[520px] opacity-15" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M340 80c90 40 150 120 160 200s-30 170-140 200-230-10-270-110 30-200 120-250 140-80 130-40z" fill="#ffffff" />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-6 md:py-12">
        
        <div className={`flex flex-col-reverse md:flex-row items-center gap-10 md:gap-12 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
          {/* Left: Text */}
          <div className={`w-full md:w-1/2 space-y-7 ${mounted ? 'opacity-100 -translate-y-0' : 'opacity-0 translate-y-3'} transition-all duration-700 delay-100`}>
            {/* Brand pill removed per request */}

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-foreground">
              Make every disposal count
              <span className="block bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">for a greener planet</span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
              Smart EcoBin helps you scan, sort, and track recyclables effortlessly. Earn eco points, find nearby smart bins, and turn daily actions into real impact.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.35)] transition-transform hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-3 p-5">
                  <Leaf className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="font-semibold">AI waste detection</p>
                    <p className="text-sm text-foreground/70">Identify recyclables instantly</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40 shadow-[0_10px_30px_-10px_rgba(20,184,166,0.35)] transition-transform hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-3 p-5">
                  <Trophy className="h-6 w-6 text-teal-600" />
                  <div>
                    <p className="font-semibold">Earn eco points</p>
                    <p className="text-sm text-foreground/70">Track progress and rewards</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40 shadow-[0_10px_30px_-10px_rgba(34,197,94,0.35)] transition-transform hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-3 p-5">
                  <Shield className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold">Clean, safe disposal</p>
                    <p className="text-sm text-foreground/70">Smart bins with guidance</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40 shadow-[0_10px_30px_-10px_rgba(132,204,22,0.35)] transition-transform hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-3 p-5">
                  <Sparkles className="h-6 w-6 text-lime-600" />
                  <div>
                    <p className="font-semibold">Community impact</p>
                    <p className="text-sm text-foreground/70">Small steps, big change</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTAs */}
            <div className="pt-1 flex items-center gap-3">
              <Button onClick={() => navigate('/auth')} size="lg" className="rounded-full px-7 py-6 text-base bg-emerald-600 hover:bg-emerald-700 shadow-[0_10px_30px_-10px_rgba(5,150,105,0.6)] hover:shadow-[0_16px_40px_-10px_rgba(5,150,105,0.7)] transition-all">
                Start your eco journey
              </Button>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className={`w-full md:w-1/2 ${mounted ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-3 scale-[0.98]'} transition-all duration-700 delay-200`}>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-emerald-400/30 to-teal-400/30 rounded-[28px] blur-2xl" />
              <img
                src={heroImage}
                alt="Recycling hero"
                className="relative rounded-[28px] shadow-2xl ring-1 ring-white/50 w-full h-[320px] md:h-[440px] object-cover saturate-110 contrast-105"
              />
              <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-emerald-700/15 mix-blend-multiply" />
              <div className="absolute -bottom-5 -right-5 bg-white/90 rounded-2xl shadow-md px-4 py-3 flex items-center gap-2">
                <Recycle className="h-5 w-5 text-eco" />
                <span className="text-sm font-medium">Join thousands going green</span>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <section id="about" className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="order-2 md:order-1 space-y-5">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">About Smart EcoBin</h2>
            <p className="text-foreground/80 text-lg leading-relaxed">
              Smart EcoBin is a sustainable waste management platform that blends AI-powered waste recognition with a rewarding recycling ecosystem. Our mission is to make responsible disposal simple, engaging, and rewarding for everyone.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
              <Button variant="outline" onClick={() => navigate('/auth')} className="border-emerald-700/40 text-emerald-800">Sign In</Button>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img
              src={heroImage}
              alt="About Smart EcoBin"
              className="rounded-3xl shadow-2xl ring-1 ring-white/60 w-full h-[340px] object-cover saturate-110 contrast-105"
            />
          </div>
        </section>

        {/* Mission and Values */}
        <section className="mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Leaf className="h-6 w-6 text-emerald-600" />
                  <h3 className="font-semibold text-lg">Sustainability First</h3>
                </div>
                <p className="text-foreground/70">Empowering communities to reduce landfill waste and increase recycling efficiency.</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-lg">Reliable & Safe</h3>
                </div>
                <p className="text-foreground/70">Guided disposal with real-time feedback ensures clean and safe recycling habits.</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="h-6 w-6 text-teal-600" />
                  <h3 className="font-semibold text-lg">Rewarding Action</h3>
                </div>
                <p className="text-foreground/70">Earn eco points for every correct disposal and unlock community recognition.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="mt-24">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-0">
                <img src={scanPhoto} alt="Scan item with guidance" className="w-full h-60 object-cover rounded-t-2xl" loading="lazy" decoding="async" />
                <div className="p-6">
                  <h3 className="font-semibold mb-1">1. Scan</h3>
                  <p className="text-foreground/70 mb-3">Identify the waste item and get instant sorting guidance.</p>
                  <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">Try Scan</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-0">
                <img src={disposePhoto} alt="Dispose in smart bin" className="w-full h-60 object-cover rounded-t-2xl" loading="lazy" decoding="async" />
                <div className="p-6">
                  <h3 className="font-semibold mb-1">2. Dispose</h3>
                  <p className="text-foreground/70 mb-3">Follow bin suggestions for clean, responsible disposal.</p>
                  <Button onClick={() => navigate('/auth')} variant="outline" className="border-emerald-700/40 text-emerald-800">Dispose Right</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-0">
                <img src={earnPhoto} alt="Earn eco rewards" className="w-full h-60 object-cover rounded-t-2xl" loading="lazy" decoding="async" />
                <div className="p-6">
                  <h3 className="font-semibold mb-1">3. Earn</h3>
                  <p className="text-foreground/70 mb-3">Collect eco points and track your positive environmental impact.</p>
                  <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">Earn Points</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="mt-24">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground text-center mb-10">Why choose EcoBin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Leaf className="h-6 w-6 text-emerald-600" />
                  <h3 className="font-semibold">Sustainable by design</h3>
                </div>
                <p className="text-foreground/70">Reduce landfill waste with smart guidance and responsible disposal.</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold">Reliable & safe</h3>
                </div>
                <p className="text-foreground/70">Clean UX, clear instructions, and secure data practices.</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-6 w-6 text-lime-600" />
                  <h3 className="font-semibold">AI assistance</h3>
                </div>
                <p className="text-foreground/70">Instant item detection and sorting suggestions at the bin.</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white/70 backdrop-blur-md border-white/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="h-6 w-6 text-teal-600" />
                  <h3 className="font-semibold">Rewards that motivate</h3>
                </div>
                <p className="text-foreground/70">Earn eco points and celebrate real, measurable impact.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-24 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">Join the eco movement</h2>
          <p className="text-foreground/80 max-w-2xl mx-auto mb-6">Start earning rewards for every responsible disposal and inspire your community to go green.</p>
          <Button onClick={() => navigate('/auth')} size="lg" className="rounded-full px-8 py-6 text-base bg-emerald-600 hover:bg-emerald-700">Create an account</Button>
        </section>
      </div>
    </div>
  );
};

export default Intro;
