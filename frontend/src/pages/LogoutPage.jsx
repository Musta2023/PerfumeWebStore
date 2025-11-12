import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const LogoutPage = () => {
  const logout = useUserStore((s) => s.logout);
  const clearCart = useCartStore((s) => s.clearCart);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await logout();
        clearCart();
        toast.success("Logged out successfully");
      } catch (_) {
        // ignore
      } finally {
        navigate("/login", { replace: true });
      }
    })();
  }, [logout, clearCart, navigate]);

  return null;
};

export default LogoutPage;
