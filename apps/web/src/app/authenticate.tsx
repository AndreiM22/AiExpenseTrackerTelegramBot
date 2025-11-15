import { auth } from "@/auth";

type AuthenticatedProps = {
  children: (sessionUserName: string) => React.ReactNode;
};

export async function Authenticate({ children }: AuthenticatedProps) {
  const session = await auth();
  const userName = session?.user?.name ?? session?.user?.email ?? "Utilizator";
  return <>{children(userName)}</>;
}
