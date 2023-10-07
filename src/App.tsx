import ConverterArea from "./components/ConverterArea";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div>
      <Toaster richColors expand={true} closeButton />
      <Navbar />
      <ConverterArea />
    </div>
  );
}
