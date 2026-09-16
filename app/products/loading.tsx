export default function ProductsLoading() {
  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        <div className="text-center py-12 border-b border-[#BBBFCA]/30 mb-12">
          <div className="h-3 w-28 bg-[#BBBFCA]/40 rounded mx-auto mb-3 animate-pulse" />
          <div className="h-10 w-56 bg-[#BBBFCA]/40 rounded mx-auto mb-3 animate-pulse" />
          <div className="h-3 w-40 bg-[#BBBFCA]/30 rounded mx-auto animate-pulse" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-8 border-b border-[#BBBFCA]/20">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-[#E8E8E8] animate-pulse rounded-sm" />
            ))}
          </div>
          <div className="h-8 w-32 bg-[#E8E8E8] animate-pulse rounded-sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[3/4] bg-[#E8E8E8] animate-pulse" />
              <div className="h-3.5 w-3/4 bg-[#BBBFCA]/40 animate-pulse rounded" />
              <div className="h-3 w-1/3 bg-[#BBBFCA]/30 animate-pulse rounded" />
              <div className="h-3.5 w-1/2 bg-[#BBBFCA]/40 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
