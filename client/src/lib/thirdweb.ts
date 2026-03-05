import { createThirdwebClient } from "thirdweb";

export const THIRDWEB_CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID || "bda3a3f4636f7c3e056ad696ea93b615";

export const thirdwebClient = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID,
});
