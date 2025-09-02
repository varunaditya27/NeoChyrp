import React from "react";

export const Footer: React.FC = () => (
  <footer className="w-full py-6 bg-gray-100 text-center text-gray-500 text-sm">
    &copy; {new Date().getFullYear()} NeoChyrp. Inspired by Chyrp Lite. All rights reserved.
  </footer>
);
export default Footer;