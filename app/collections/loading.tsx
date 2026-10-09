export default function CollectionsLoading() {
  return (
    <div className="pt-16 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        <div className="text-center py-6 border-b border-[#BBBFCA]/30 mb-16">
          <div className="h-3 w-36 bg-[#BBBFCA]/40 rounded mx-auto mb-3 animate-pulse" />
          <div className="h-10 w-48 bg-[#BBBFCA]/40 rounded mx-auto mb-3 animate-pulse" />
          <div className="h-3 w-64 bg-[#BBBFCA]/25 rounded mx-auto animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col bg-[#E8E8E8] overflow-hidden">
              <div className="aspect-[4/5] bg-[#BBBFCA]/30 animate-pulse" />
              <div className="p-6 flex items-center justify-between">
                <div className="h-3 w-3/4 bg-[#BBBFCA]/40 animate-pulse rounded" />
                <div className="w-4 h-4 bg-[#BBBFCA]/30 animate-pulse rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
