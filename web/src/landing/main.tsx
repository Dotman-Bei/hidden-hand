import "../polyfills";
import { createRoot } from "react-dom/client";
import { PitIllustration } from "./PitIllustration";

const root = document.getElementById("pit-root");
if (root) createRoot(root).render(<PitIllustration />);
