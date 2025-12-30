import { useState, useEffect } from 'react';
import { useBrand } from '../contexts/BrandContext';
import { supabase } from '../lib/supabase';
import { Building2, Calendar, Package, Phone, Mail, MapPin, ArrowRight, Clock, Shield, Award, Users, CheckCircle, FileSearch, Hammer, Truck, Circle } from 'lucide-react';
import * as Icons from 'lucide-react';

interface PublicHomeProps {
  onNavigateToTracker: () => void;
  onNavigateToCustomerLogin: () => void;
  onNavigateToBooking: () => void;
  onNavigateToSubmitRequest: () => void;
}

export function PublicHome({ onNavigateToTracker, onNavigateToCustomerLogin, onNavigateToBooking, onNavigateToSubmitRequest }: PublicHomeProps) {
  const { brand } = useBrand();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerMenu, setHeaderMenu] = useState<any[]>([]);
  const [footerMenu, setFooterMenu] = useState<any[]>([]);
  const [roadmapSettings, setRoadmapSettings] = useState<any>(null);

  useEffect(() => {
    fetchMenusAndSettings();
  }, []);

  const fetchMenusAndSettings = async () => {
    try {
      const { data } = await supabase
        .from('portal_settings')
        .select('header_menu, footer_menu, setting_value')
        .eq('setting_key', 'home_page')
        .maybeSingle();

      if (data) {
        setHeaderMenu(data.header_menu || []);
        setFooterMenu(data.footer_menu || []);
        if (data.setting_value && data.setting_value.roadmap) {
          setRoadmapSettings(data.setting_value.roadmap);
        }
      }
    } catch (error) {
      console.error('Error fetching menus and settings:', error);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon || Circle;
  };

  const handleMenuClick = (url: string, isExternal: boolean, openNewTab: boolean) => {
    if (isExternal) {
      window.open(url, openNewTab ? '_blank' : '_self');
    } else {
      window.location.href = url;
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src={brand?.logos.primary || '/Untitled-design-3.png'}
                alt={`${brand?.company.name || 'BYLROS'} Logo`}
                className="h-12 w-auto"
              />
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {headerMenu.length > 0 ? (
                <>
                  {headerMenu.sort((a, b) => a.order - b.order).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleMenuClick(item.url, item.is_external, item.open_new_tab)}
                      className="text-slate-700 hover:text-[#bb2738] transition-colors font-medium"
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={onNavigateToCustomerLogin}
                    className="px-5 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-medium"
                  >
                    Login / Register
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onNavigateToSubmitRequest}
                    className="text-slate-700 hover:text-[#bb2738] transition-colors font-medium"
                  >
                    Submit Request
                  </button>
                  <button
                    onClick={onNavigateToBooking}
                    className="text-slate-700 hover:text-[#bb2738] transition-colors font-medium"
                  >
                    Book Site Visit
                  </button>
                  <button
                    onClick={onNavigateToTracker}
                    className="text-slate-700 hover:text-[#bb2738] transition-colors font-medium"
                  >
                    Track Order
                  </button>
                  <button
                    onClick={onNavigateToCustomerLogin}
                    className="px-5 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-medium"
                  >
                    Login / Register
                  </button>
                </>
              )}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <button
                onClick={() => {
                  onNavigateToSubmitRequest();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-slate-700 hover:text-[#bb2738] transition-colors font-medium"
              >
                Submit Request
              </button>
              <button
                onClick={() => {
                  onNavigateToBooking();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-slate-700 hover:text-[#bb2738] transition-colors font-medium"
              >
                Book Site Visit
              </button>
              <button
                onClick={() => {
                  onNavigateToTracker();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-slate-700 hover:text-[#bb2738] transition-colors font-medium"
              >
                Track Order
              </button>
              <button
                onClick={() => {
                  onNavigateToCustomerLogin();
                  setMobileMenuOpen(false);
                }}
                className="block w-full px-5 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-medium text-center"
              >
                Login / Register
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="pt-16">
        <section id="home" className="relative bg-gradient-to-br from-slate-50 to-slate-100 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                  {brand?.company.tagline || 'Premium Glass & Aluminum Solutions'}
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 mb-8">
                  {brand?.company.description || 'Transform your space with expert craftsmanship. From residential to commercial projects, we deliver exceptional quality and service at every step.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={onNavigateToCustomerLogin}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-semibold text-lg"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onNavigateToTracker}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-[#bb2738] border-2 border-[#bb2738] rounded-lg transition-colors font-semibold text-lg"
                  >
                    <Package className="w-5 h-5" />
                    Track Order
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-[#bb2738]/10 to-[#bb2738]/5 rounded-3xl flex items-center justify-center">
                  <Building2 className="w-48 h-48 text-[#bb2738]/20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="welcome" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
                Welcome to {brand?.company.name || 'BYLROS'}
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Your trusted partner in glass and aluminum installations. We bring innovation, quality,
                and expertise to every project, ensuring your complete satisfaction.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-16 h-16 bg-[#bb2738] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Expert Craftsmanship</h3>
                <p className="text-slate-600">
                  Our skilled technicians deliver precision installations with meticulous attention to detail.
                </p>
              </div>

              <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-16 h-16 bg-[#bb2738] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Quality Guaranteed</h3>
                <p className="text-slate-600">
                  Premium materials and rigorous quality control ensure lasting results you can trust.
                </p>
              </div>

              <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-16 h-16 bg-[#bb2738] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Timely Delivery</h3>
                <p className="text-slate-600">
                  We value your time with prompt service and on-schedule project completion.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
                Why Choose {brand?.company.name || 'BYLROS'}?
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Experience the difference with our comprehensive approach to glass and aluminum solutions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#bb2738]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Free Consultation</h3>
                    <p className="text-sm text-slate-600">Expert advice and site assessment at no cost to help plan your project</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#bb2738]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Custom Solutions</h3>
                    <p className="text-sm text-slate-600">Tailored designs to match your specific requirements and preferences</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#bb2738]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Premium Materials</h3>
                    <p className="text-sm text-slate-600">High-quality glass and aluminum from trusted manufacturers</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#bb2738]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Professional Installation</h3>
                    <p className="text-sm text-slate-600">Certified technicians with years of experience in the industry</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#bb2738]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Tracking</h3>
                    <p className="text-sm text-slate-600">Monitor your order progress from quote to installation completion</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#bb2738]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Warranty Protection</h3>
                    <p className="text-sm text-slate-600">Comprehensive warranty coverage for your peace of mind</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {roadmapSettings?.enabled && roadmapSettings?.steps && roadmapSettings.steps.length > 0 && (
          <section id="roadmap" className="py-20" style={{ backgroundColor: roadmapSettings.backgroundColor }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
                  {roadmapSettings.title}
                </h2>
                <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                  {roadmapSettings.subtitle}
                </p>
              </div>

              <div className="relative">
                <div className="hidden md:block absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#bb2738] via-[#bb2738] to-[#bb2738] opacity-20" style={{ top: '3rem' }}></div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
                  {roadmapSettings.steps.map((step: any, index: number) => {
                    const IconComponent = getIcon(step.icon);
                    return (
                      <div key={index} className="relative">
                        <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-[#bb2738] text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                              <IconComponent className="w-12 h-12" />
                            </div>
                            <div className="w-12 h-12 bg-white border-4 border-[#bb2738] text-[#bb2738] rounded-full flex items-center justify-center font-bold text-xl -mt-8 mb-4 shadow-md">
                              {step.order}
                            </div>
                          </div>

                          <div className="flex-1 md:text-center">
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{step.description}</p>
                          </div>
                        </div>

                        {index < roadmapSettings.steps.length - 1 && (
                          <div className="md:hidden absolute left-12 top-24 bottom-0 w-0.5 bg-[#bb2738]/30"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="visits" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6">
                  Schedule Your Site Visit
                </h2>
                <p className="text-lg text-slate-600 mb-6">
                  Start your project with a professional site assessment. Our experts will visit your location,
                  take measurements, and provide personalized recommendations.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-6 h-6 text-[#bb2738] mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Flexible Scheduling</h3>
                      <p className="text-slate-600">Choose a time that works best for you</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-6 h-6 text-[#bb2738] mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Expert Assessment</h3>
                      <p className="text-slate-600">Professional evaluation of your requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="w-6 h-6 text-[#bb2738] mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Free Quote</h3>
                      <p className="text-slate-600">Detailed pricing with no hidden costs</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onNavigateToBooking}
                  className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-semibold"
                >
                  Book Site Visit Now
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-8">
                <div className="aspect-square bg-white rounded-xl flex items-center justify-center border border-slate-200">
                  <Calendar className="w-32 h-32 text-[#bb2738]/20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                  Get In Touch
                </h2>
                <p className="text-lg text-slate-300 mb-8">
                  Have questions? We're here to help. Reach out to our team for any inquiries about our services.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#bb2738] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Call Support 24/7</h3>
                      <p className="text-slate-300">{brand?.contact.phone || '+971-52-5458-968'}</p>
                      <p className="text-sm text-slate-400">{brand?.contact.operatingHours || 'Available around the clock'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#bb2738] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Send Me Email</h3>
                      <p className="text-slate-300">{brand?.contact.email || 'info@bylros.ae'}</p>
                      <p className="text-sm text-slate-400">We'll respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#bb2738] rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Visit Our Office</h3>
                      <p className="text-slate-300">{brand?.contact.address.street || 'Costra Business Park (Block B)'}</p>
                      <p className="text-slate-300">{brand?.contact.address.area || 'Production City'}, {brand?.contact.address.city || 'Dubai'}, {brand?.contact.address.country || 'UAE'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Ready to Start Your Project?
                </h3>
                <p className="text-slate-300 mb-6">
                  Register for a customer account to request quotes, schedule site visits, and track your orders.
                </p>
                <button
                  onClick={onNavigateToCustomerLogin}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-semibold"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="mt-8 pt-8 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-4">Already have an account?</p>
                  <button
                    onClick={onNavigateToCustomerLogin}
                    className="w-full px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-black text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="mb-4">
                  <img
                    src={brand?.logos.primary || '/Untitled-design-3.png'}
                    alt={`${brand?.company.name || 'BYLROS'} Logo`}
                    className="h-16 w-auto mb-2"
                  />
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">
                  {brand?.company.fullName || 'ALUMINUM & GLASS SYSTEM'}
                </p>
                <p className="text-slate-500 text-xs mb-3">
                  SINCE {brand?.company.foundingYear || '1985'}
                </p>
                <p className="text-slate-400 text-sm">
                  Premium glass and aluminum solutions for residential and commercial projects.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-2 text-slate-400 text-sm">
                  {footerMenu.length > 0 ? (
                    footerMenu.sort((a, b) => a.order - b.order).map((item, index) => (
                      <li key={index}>
                        <button
                          onClick={() => handleMenuClick(item.url, item.is_external, item.open_new_tab)}
                          className="hover:text-white transition-colors"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">
                          Home
                        </button>
                      </li>
                      <li>
                        <button onClick={onNavigateToBooking} className="hover:text-white transition-colors">
                          Book Site Visit
                        </button>
                      </li>
                      <li>
                        <button onClick={onNavigateToTracker} className="hover:text-white transition-colors">
                          Track Order
                        </button>
                      </li>
                      <li>
                        <button onClick={onNavigateToCustomerLogin} className="hover:text-white transition-colors">
                          Login / Register
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Services</h3>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>
                    <a href="https://bylros.ae/about-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="https://bylros.ae/our-services/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                      Our Services
                    </a>
                  </li>
                  <li>
                    <a href="https://bylros.ae/project/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                      Project
                    </a>
                  </li>
                  <li>
                    <a href="https://bylros.ae/carrers/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                      Carrers
                    </a>
                  </li>
                  <li>
                    <a href="https://bylros.ae/faqs/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                      FAQs
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Contact</h3>
                <ul className="space-y-3 text-slate-400 text-sm">
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{brand?.contact.phone || '+971-52-5458-968'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{brand?.contact.email || 'info@bylros.ae'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1" />
                    <span>{brand?.contact.address.fullAddress || 'Costra Business Park (Block B), Production City, Dubai, UAE'}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} {brand?.company.name || 'BYLROS'}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
