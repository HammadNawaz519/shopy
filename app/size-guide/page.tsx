import React from "react";

export default function SizeGuidePage() {
  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center py-16 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            ATELIER FIT GUIDE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
            Size &amp; Measurements
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-3">
            All measurements are taken flat in inches. SHOPY pieces feature an architectural, relaxed fit.
          </p>
        </div>

        {/* Tops Measurement Table */}
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-medium text-[#495464]">
              Tops, Knitwear &amp; Jackets
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs uppercase tracking-wider border border-[#BBBFCA]/40 bg-[#E8E8E8]/40">
                <thead className="bg-[#495464] text-[#F4F4F2]">
                  <tr>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Chest (Inches)</th>
                    <th className="p-3.5">Shoulder</th>
                    <th className="p-3.5">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/30">
                  <tr>
                    <td className="p-3.5 font-semibold">XS</td>
                    <td className="p-3.5">40&quot;</td>
                    <td className="p-3.5">19.5&quot;</td>
                    <td className="p-3.5">27&quot;</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold">S</td>
                    <td className="p-3.5">42&quot;</td>
                    <td className="p-3.5">20.5&quot;</td>
                    <td className="p-3.5">28&quot;</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold">M</td>
                    <td className="p-3.5">44&quot;</td>
                    <td className="p-3.5">21.5&quot;</td>
                    <td className="p-3.5">29&quot;</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold">L</td>
                    <td className="p-3.5">46&quot;</td>
                    <td className="p-3.5">22.5&quot;</td>
                    <td className="p-3.5">30&quot;</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold">XL</td>
                    <td className="p-3.5">48&quot;</td>
                    <td className="p-3.5">23.5&quot;</td>
                    <td className="p-3.5">31&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trousers Measurement Table */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-medium text-[#495464]">
              Trousers &amp; Bottoms
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs uppercase tracking-wider border border-[#BBBFCA]/40 bg-[#E8E8E8]/40">
                <thead className="bg-[#495464] text-[#F4F4F2]">
                  <tr>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Waist (Inches)</th>
                    <th className="p-3.5">Inseam</th>
                    <th className="p-3.5">Thigh</th>
                    <th className="p-3.5">Leg Opening</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/30">
                  <tr>
                    <td className="p-3.5 font-semibold">28 / S</td>
                    <td className="p-3.5">28-30&quot;</td>
                    <td className="p-3.5">30&quot;</td>
                    <td className="p-3.5">24&quot;</td>
                    <td className="p-3.5">18&quot;</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold">30 / M</td>
                    <td className="p-3.5">30-32&quot;</td>
                    <td className="p-3.5">31&quot;</td>
                    <td className="p-3.5">25&quot;</td>
                    <td className="p-3.5">18.5&quot;</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold">32 / L</td>
                    <td className="p-3.5">32-34&quot;</td>
                    <td className="p-3.5">32&quot;</td>
                    <td className="p-3.5">26&quot;</td>
                    <td className="p-3.5">19&quot;</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold">34 / XL</td>
                    <td className="p-3.5">34-36&quot;</td>
                    <td className="p-3.5">32&quot;</td>
                    <td className="p-3.5">27&quot;</td>
                    <td className="p-3.5">19.5&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
