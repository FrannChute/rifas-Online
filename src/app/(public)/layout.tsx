import { SiteFooter } from "@/components/site-footer";
import { WelcomeNoticeModal } from "@/components/welcome-notice-modal";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WelcomeNoticeModal />
      {children}
      <SiteFooter />
    </>
  );
}
