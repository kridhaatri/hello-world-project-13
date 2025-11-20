import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LucideIcon, Server, Globe, Link, Database, Cloud, Network, Lock, Box, FileText } from "lucide-react";

export interface Resource {
  id: string;
  icon: string;
  title: string;
  value: string;
  description: string;
}

interface ResourceContextType {
  resources: Resource[];
  updateResource: (id: string, updates: Partial<Resource>) => void;
  creatorInfo: {
    name: string;
    tagline: string;
  };
  updateCreatorInfo: (info: { name: string; tagline: string }) => void;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

const iconMap: Record<string, LucideIcon> = {
  Server,
  Globe,
  Link,
  Database,
  Cloud,
  Network,
  Lock,
  Box,
  FileText,
};

export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Server;
};

const defaultResources: Resource[] = [
  {
    id: "1",
    icon: "Server",
    title: "Virtual Machine",
    value: "VM-Server-01",
    description: "Your primary virtual machine instance"
  },
  {
    id: "2",
    icon: "Globe",
    title: "Website Name",
    value: "myawesomesite.com",
    description: "Your main website domain"
  },
  {
    id: "3",
    icon: "Link",
    title: "Subdomain Name",
    value: "app.mysite.com",
    description: "Application subdomain endpoint"
  },
  {
    id: "4",
    icon: "Database",
    title: "SQL Database",
    value: "prod-db-main",
    description: "Production SQL database server"
  },
  {
    id: "5",
    icon: "Cloud",
    title: "Storage Account",
    value: "storageaccount123",
    description: "Blob and file storage container"
  },
  {
    id: "6",
    icon: "Network",
    title: "Virtual Network",
    value: "vnet-production",
    description: "Azure virtual network gateway"
  },
  {
    id: "7",
    icon: "Lock",
    title: "Key Vault",
    value: "keyvault-secrets",
    description: "Secure secrets and certificates"
  },
  {
    id: "8",
    icon: "Box",
    title: "App Service",
    value: "webapp-prod-01",
    description: "Web application hosting service"
  },
  {
    id: "9",
    icon: "FileText",
    title: "Resource Group",
    value: "rg-production",
    description: "Resource group container"
  }
];

const defaultCreatorInfo = {
  name: "Your Name Here",
  tagline: "Built with passion using modern cloud technologies"
};

export const ResourceProvider = ({ children }: { children: ReactNode }) => {
  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem("dashboardResources");
    return saved ? JSON.parse(saved) : defaultResources;
  });

  const [creatorInfo, setCreatorInfo] = useState(() => {
    const saved = localStorage.getItem("creatorInfo");
    return saved ? JSON.parse(saved) : defaultCreatorInfo;
  });

  useEffect(() => {
    localStorage.setItem("dashboardResources", JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem("creatorInfo", JSON.stringify(creatorInfo));
  }, [creatorInfo]);

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources(prev =>
      prev.map(resource =>
        resource.id === id ? { ...resource, ...updates } : resource
      )
    );
  };

  const updateCreatorInfo = (info: { name: string; tagline: string }) => {
    setCreatorInfo(info);
  };

  return (
    <ResourceContext.Provider value={{ resources, updateResource, creatorInfo, updateCreatorInfo }}>
      {children}
    </ResourceContext.Provider>
  );
};

export const useResources = () => {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error("useResources must be used within ResourceProvider");
  }
  return context;
};
