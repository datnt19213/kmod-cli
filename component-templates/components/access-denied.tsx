"use client";

import {
  ArrowLeft,
  Ban,
  Mail,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';

import { Button } from '../ui/button';
import {
  Card,
  CardContent,
} from '../ui/card';

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showContactButton?: boolean;
  contactButtonLabel?: string;
  backButtonLabel?: string;
  onBack?: () => void;
  onContact?: () => void;
  mailAddress?: string;
  lottieSrc?: string;
}

export default function AccessDenied({
  title = "Không có quyền truy cập",
  message = "Bạn không có quyền xem nội dung này. Vui lòng liên hệ người quản trị để được cấp quyền.",
  contactButtonLabel = "Liên hệ",
  backButtonLabel = "Quay lại",
  showBackButton = true,
  showContactButton = true,
  mailAddress = "support@yourdomain.com",
  lottieSrc,
  onBack,
  onContact,
}: AccessDeniedProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleContact = () => {
    if (onContact) {
      onContact();
    } else {
      // Default contact action - could be email or support page
      window.location.href = `mailto:${mailAddress}`;
    }
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Lottie animationData={lottieSrc} className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-3 text-xl font-semibold text-gray-900">{title}</h2>

          {/* Message */}
          <p className="mb-6 text-sm leading-relaxed text-gray-600">{message}</p>

          {/* Actions */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            {showBackButton && (
              <Button variant="outline" onClick={handleBack} className="flex items-center gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                {backButtonLabel}
              </Button>
            )}
            {showContactButton && (
              <Button onClick={handleContact} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {contactButtonLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact version for inline use
export function AccessDeniedInline({ message = "Bạn không có quyền xem nội dung này" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-center gap-3 text-red-700">
        <Ban className="h-5 w-5" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// Banner version for top of page
export function AccessDeniedBanner({ message = "Quyền truy cập bị hạn chế", onDismiss }: { message?: string; onDismiss?: () => void }) {
  return (
    <div className="mb-4 border-l-4 border-red-400 bg-red-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Ban className="mr-3 h-5 w-5 text-red-400" />
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <Button variant="ghost" size="icon" onClick={onDismiss} className="text-red-700 hover:text-red-800">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
