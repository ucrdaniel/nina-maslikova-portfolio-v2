/* eslint-disable @typescript-eslint/no-explicit-any */
import LogoLoop from "../marquees/LogoLoop";

const imageLogos = [
  { src: "/logos/archicad.png", alt: "ArchiCAD" },
  { src: "/logos/autocad.png", alt: "AutoCAD" },
  { src: "/logos/sketchup.png", alt: "SketchUp" },
  { src: "/logos/3dsmax.png", alt: "3ds Max" },
  { src: "/logos/photoshop.png", alt: "Adobe Photoshop" },
  { src: "/logos/indesign.png", alt: "Adobe InDesign" },
  { src: "/logos/revit.png", alt: "Revit" },
];

export default function AboutLogos() {
  return (
    <div className="mt-10">
      <LogoLoop
        logos={imageLogos}
        speed={60}
        direction="left"
        logoHeight={80}
        gap={48}
        pauseOnHover
        scaleOnHover
        fadeOut
        fadeOutColor="#FAFAFA"
        ariaLabel="Software and tools"
      />
    </div>
  );
}
