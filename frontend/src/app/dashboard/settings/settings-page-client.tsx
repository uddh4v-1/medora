"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/provider";

import { DashboardPageHeader } from "../_components/page-header";
import { AppearanceSettings } from "./_components/appearance-settings";
import { BrandingSettings } from "./_components/branding-settings";
import { DataExportSettings } from "./_components/data-export-settings";
import { ProfileSettings } from "./_components/profile-settings";
import { PublicBookingSettings } from "./_components/public-booking-settings";
import { TeamSettings } from "./_components/team-settings";

export function SettingsPageClient() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <DashboardPageHeader
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
      />

      <Tabs defaultValue="profile" className="gap-4">
        <TabsList>
          <TabsTrigger value="profile">{t("settings.tabProfile")}</TabsTrigger>
          <TabsTrigger value="team">{t("settings.tabTeam")}</TabsTrigger>
          <TabsTrigger value="public-booking">
            {t("settings.tabPublicBooking")}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            {t("settings.tabAppearance")}
          </TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="data-export">Data & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="public-booking">
          <PublicBookingSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="data-export">
          <DataExportSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
