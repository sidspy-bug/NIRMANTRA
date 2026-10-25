"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Edit2,
  Check,
  X,
  Camera,
  ArrowLeft,
  AlertCircle,
  Info,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserAvatarIcon } from "@/components/common/emblems";
import { useAuth } from "@/context/auth-context";

export default function MyProfilePage() {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [contactNumber, setContactNumber] = useState(
    user?.contactNumber && user.contactNumber !== "Not provided" ? user.contactNumber : ""
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSavedNotice(null);

    if (!name.trim()) {
      setValidationError("Full name cannot be empty.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    updateProfile({
      name: name.trim(),
      email: email.trim(),
      contactNumber: contactNumber.trim() || "Not provided",
    });

    setIsEditing(false);
    setSavedNotice("Profile updated successfully in your active session.");
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setContactNumber(
      user?.contactNumber && user.contactNumber !== "Not provided" ? user.contactNumber : ""
    );
    setIsEditing(false);
    setValidationError(null);
  };

  return (
    <PageContainer
      title="User Profile & Directorate Account Details"
      description="Official credential profile, assigned role permissions, and contact verification."
      breadcrumbs={[
        { label: "Account", href: "#" },
        { label: "My Profile" },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {savedNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold">
            {savedNotice}
          </div>
        )}

        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
            {validationError}
          </div>
        )}

        <Card className="bg-white shadow-2xs border border-slate-200">
          <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 tracking-tight">
                My Profile
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Official Nirmaantra user account record
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Avatar & Change Photo */}
              <div className="md:col-span-4 flex flex-col items-center text-center space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
                <UserAvatarIcon className="w-28 h-28 shadow-sm" />

                <div>
                  <h3 className="font-bold text-sm text-slate-900">{user?.name || "Guest"}</h3>
                  <p className="text-xs text-slate-500">{user?.role || "Citizen"}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert("Photo updates are managed via LDAP / Directorate HR Portal.")}
                  className="text-xs"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" /> Change Photo
                </Button>

                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  Session: {user?.accountStatus || "Demo Session"}
                </div>
              </div>

              {/* Right Column: Profile Fields */}
              <div className="md:col-span-8">
                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          User ID (Protected)
                        </label>
                        <Input
                          value={user?.userId || ""}
                          disabled
                          className="text-xs bg-slate-100 font-mono text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Assigned Role (Protected)
                        </label>
                        <Input
                          value={user?.role || ""}
                          disabled
                          className="text-xs bg-slate-100 font-semibold text-slate-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Department (Protected)
                      </label>
                      <Input
                        value={user?.department || ""}
                        disabled
                        className="text-xs bg-slate-100 text-slate-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Contact Number
                        </label>
                        <Input
                          type="text"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="Not provided"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        type="submit"
                        className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="text-xs"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Name:</span>
                      <span className="font-bold text-slate-900">{user?.name}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">User ID:</span>
                      <span className="font-mono font-bold text-slate-900">{user?.userId}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Role:</span>
                      <Badge variant="outline" className="text-xs font-bold bg-white text-[#2a1b4e]">
                        {user?.role}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Department:</span>
                      <span className="font-semibold text-slate-800">{user?.department}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Email:</span>
                      <span className="font-mono text-slate-800">{user?.email}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Contact Number:</span>
                      <span className="text-slate-800">{user?.contactNumber || "Not provided"}</span>
                    </div>
                  </div>
                )}

                <div className="mt-5 p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <span>
                    <strong>Security Policy:</strong> Official roles and ID numbers cannot be altered by users from the frontend interface. Edits in demo mode are persisted locally in browser state.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
