"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  HardHat,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { StateEmblemOfIndia, NirmaantraLogo } from "@/components/common/emblems";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, UserRole } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>("General Public");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleOptions: {
    role: UserRole;
    icon: React.ElementType;
    description: string;
    sampleId: string;
  }[] = [
    {
      role: "General Public",
      icon: Users,
      description: "Submit plans, track applications, file grievances",
      sampleId: "GP-2026-8812",
    },
    {
      role: "Inspecting Officer",
      icon: HardHat,
      description: "Conduct inspections, upload reports, manage schedules",
      sampleId: "IO-2026-0178",
    },
    {
      role: "Supervisor",
      icon: ShieldCheck,
      description: "Review applications, verify reports, manage approvals",
      sampleId: "SP-2026-0042",
    },
  ];

  const handleRoleSelect = (role: UserRole, sampleId: string) => {
    setSelectedRole(role);
    if (!username || username.startsWith("GP-") || username.startsWith("IO-") || username.startsWith("SP-")) {
      setUsername(sampleId);
    }
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(selectedRole, username, password);
    setLoading(false);

    if (res.success) {
      // Direct to dedicated two-second splash screen as requested
      router.push("/splash");
    } else {
      setError(res.error || "Authentication failed. Please verify credentials.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-4 bg-white">
      <div className="w-full max-w-xl mx-auto space-y-4">
        {/* Top Header Identity Banner */}
        <div className="text-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          {/* Authentic State Emblem of India */}
          <div className="flex justify-center">
            <StateEmblemOfIndia className="w-12 h-16" />
          </div>

          {/* Logo & Taglines */}
          <div>
            <NirmaantraLogo className="justify-center" />
            <p className="text-xs font-bold text-slate-800 tracking-wide mt-1">
              Building Safety & Compliance Portal
            </p>
            <p className="text-[11px] text-slate-600 font-serif">
              निर्माण सुरक्षा एवं अनुपालन पोर्टल • दिल्ली राष्ट्रीय राजधानी क्षेत्र
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-lg font-black text-slate-900 tracking-tight">
              Login to NIRMAANTRA
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Select your user type to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Select User Type (3 Role Cards) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Step 1: Select User Type
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedRole === opt.role;

                  return (
                    <button
                      type="button"
                      key={opt.role}
                      onClick={() => handleRoleSelect(opt.role, opt.sampleId)}
                      className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#3b185f] ${
                        isSelected
                          ? "bg-[#f3e8ff]/60 border-[#3b185f] ring-1 ring-[#3b185f] shadow-xs"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                            isSelected
                              ? "bg-[#2a1b4e] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4
                          className={`text-xs font-bold leading-tight ${
                            isSelected ? "text-[#2a1b4e]" : "text-slate-800"
                          }`}
                        >
                          {opt.role}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Enter Credentials */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Step 2: Enter Credentials
              </label>

              {/* Username Input */}
              <div className="space-y-1">
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username / User ID"
                    className="pl-9 text-xs h-10 border-slate-300 focus-visible:ring-[#3b185f]"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (e.g. demo123)"
                    className="pl-9 pr-9 text-xs h-10 border-slate-300 focus-visible:ring-[#3b185f]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demonstration Helper Note */}
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-1.5">
                <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Demo Mode Active:</strong> For testing, enter any password (e.g. <code>demo123</code>).
                  Selected role will activate corresponding portal features.
                </span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold h-10 shadow-md"
              >
                {loading ? "Authenticating..." : "Login"}
              </Button>

              {/* Card Footer Links */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  type="button"
                  onClick={() => alert("Password reset is managed by the Directorate IT Admin.")}
                  className="text-[#3b185f] font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  onClick={() => alert("Helpdesk Helpline: 1800-11-2026 (Toll-Free).")}
                  className="text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Need Help?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
