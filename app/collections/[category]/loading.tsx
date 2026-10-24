export default function CategoryLoading() {
  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="relative w-full h-[40vh] min-h-[300px] bg-[#BBBFCA]/20 animate-pulse mb-10" />
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between pb-4 mb-8 border-b border-[#BBBFCA]/30">
          <div className="h-3 w-28 bg-[#BBBFCA]/40 animate-pulse rounded" />
          <div className="h-3 w-32 bg-[#BBBFCA]/30 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[2/3] bg-[#E8E8E8] animate-pulse" />
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
