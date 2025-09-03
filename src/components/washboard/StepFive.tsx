import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Globe, Shield, Clock, Check, X, Loader2, DollarSign, Plus, Trash2, LogIn, UserPlus } from 'lucide-react';
import { wizardService, type CheckDomainRequest, type DomainAvailabilityResponse } from "@/lib/services";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface StepFiveProps {
  data: {
    userInfo?: {
      name?: string;
      email?: string;
      domain?: string;
      domainExtension?: string;
      domainPrice?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
    websiteFramework?: {
      dynamicDesign?: {
        pages: Array<{
          id: string;
          name: string;
          sections: Array<{
            id: string;
            sectionType: string;
            layoutId: string;
            order: number;
            customData?: Record<string, unknown>;
          }>;
          canvasDimensions: {
            width: number;
            height: number;
          };
        }>;
        currentPageId: string;
      };
    };
  };
  updateData: (data: Partial<{
    userInfo: {
      name?: string;
      email?: string;
      domain?: string;
      domainExtension?: string;
      domainPrice?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
  }>) => void;
}

// Use the imported type instead of local interface
type DomainAvailability = DomainAvailabilityResponse;
