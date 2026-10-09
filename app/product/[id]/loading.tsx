export default function ProductDetailLoading() {
  return (
    <div className="pt-16 sm:pt-20 lg:pt-24 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-3 w-24 bg-[#BBBFCA]/40 animate-pulse rounded" />
          <div className="h-3 w-3 bg-[#BBBFCA]/30 animate-pulse rounded" />
          <div className="h-3 w-20 bg-[#BBBFCA]/40 animate-pulse rounded" />
          <div className="h-3 w-3 bg-[#BBBFCA]/30 animate-pulse rounded" />
          <div className="h-3 w-32 bg-[#BBBFCA]/40 animate-pulse rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3 lg:gap-4">
            <div className="flex sm:flex-col gap-2.5 sm:w-20 lg:w-24 flex-shrink-0">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-16 sm:w-full aspect-[3/4] bg-[#E8E8E8] animate-pulse" />
              ))}
            </div>
            <div className="flex-1 aspect-[3/4] max-h-[460px] sm:max-h-[500px] lg:max-h-[540px] bg-[#E8E8E8] animate-pulse" />
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-3">
              <div className="h-3 w-20 bg-[#BBBFCA]/30 animate-pulse rounded" />
              <div className="h-8 w-3/4 bg-[#BBBFCA]/40 animate-pulse rounded" />
              <div className="h-5 w-1/3 bg-[#BBBFCA]/30 animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#BBBFCA]/25 animate-pulse rounded" />
              <div className="h-3 w-5/6 bg-[#BBBFCA]/25 animate-pulse rounded" />
              <div className="h-3 w-4/6 bg-[#BBBFCA]/25 animate-pulse rounded" />
            </div>
            <div className="flex gap-2.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-[#BBBFCA]/40 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
              {["XS", "S", "M", "L", "XL"].map((s) => (
                <div key={s} className="py-2 bg-[#E8E8E8] animate-pulse" />
              ))}
            </div>
            <div className="flex gap-3">
              <div className="w-24 h-11 bg-[#E8E8E8] animate-pulse" />
              <div className="flex-1 h-11 bg-[#BBBFCA]/40 animate-pulse" />
            </div>
            <div className="h-11 w-full bg-[#E8E8E8] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
