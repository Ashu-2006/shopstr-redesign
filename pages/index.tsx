import type { GetServerSideProps } from "next";

/** Entry → marketplace (the default discovery surface). */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/marketplace", permanent: false },
});

export default function Index() {
  return null;
}
