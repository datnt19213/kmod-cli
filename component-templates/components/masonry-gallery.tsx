import 'react-loading-skeleton/dist/skeleton.css';

import React from 'react';

import { Ellipsis } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Image } from './image';

// ================== Types ==================
export type ImageInfo = {
  id: any;
  key: string;
  url: string;
  preview_image: string;
  mimetype: string;
  name: string;
  size: number;
  alt: string;
  created_at: string;
  show_edit: boolean;
  user: {
    id: number;
    name: string;
    avt: string;
  };
};

export type ImageCardAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (item: ImageInfo) => void;
  className?: string;
};

type ImageCardProps = {
  item: ImageInfo;
  onClick: (item: ImageInfo) => void;
  actions?: ImageCardAction[];
  renderHeader?: (item: ImageInfo) => React.ReactNode;
  renderFooter?: (item: ImageInfo) => React.ReactNode;
};

// ================== ImageCard ==================
const ImageCard: React.FC<ImageCardProps> = ({
  item,
  onClick,
  actions = [],
  renderHeader,
  renderFooter,
}) => {
  return (
    <div className="group animate-fade-up relative flex w-full flex-col overflow-hidden rounded-xl transition-all duration-300 hover:bg-foreground/5">
      {/* Header */}
      {renderHeader ? (
        renderHeader(item)
      ) : (
        item.mimetype && (
          <span className="absolute top-2 left-2 rounded-md bg-foreground/10 px-2 py-0.5 text-xs font-medium text-background backdrop-blur-sm">
            {item.mimetype.replace(/^image\//, "").toUpperCase()}
          </span>
        )
      )}

      {/* Image */}
      <Image
        src={item.preview_image}
        alt={item.alt}
        className="border-border bg-background min-h-[100px] cursor-pointer rounded-xl border transition-all duration-300 group-hover:border-green-500"
        imageClass="transition-all duration-300 group-hover:scale-105"
        onClick={() => onClick(item)}
      />

      {/* Footer */}
      {renderFooter ? (
        renderFooter(item)
      ) : (
        <div className="flex w-full items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            <Image src={item.user.avt} className="h-5 w-5 rounded-full" />
            <p className="line-clamp-1 text-sm font-medium text-foreground">
              {item.user.name}
            </p>
          </div>
          {actions.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full p-1 shadow-none"
                >
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="z-[120] max-w-[200px] p-1">
                <div className="flex flex-col">
                  {actions.map((action) => (
                    <Button
                      key={action.key}
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(item);
                      }}
                      className={`flex items-center gap-2 shadow-none ${action.className ?? ""}`}
                    >
                      {action.icon}
                      <p className="text-sm font-medium">{action.label}</p>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
};

// ================== MasonryWithSkeleton ==================
type MasonryWithSkeletonProps = {
  items: ImageInfo[];
  loading?: boolean;
  onClick: (item: ImageInfo) => void;
  actions?: ImageCardAction[];
  renderHeader?: (item: ImageInfo) => React.ReactNode;
  renderFooter?: (item: ImageInfo) => React.ReactNode;
  breakpoint?: Record<number, number>;
};

const MasonryWithSkeleton: React.FC<MasonryWithSkeletonProps> = ({
  items,
  loading = false,
  onClick,
  actions,
  renderHeader,
  renderFooter,
  breakpoint = { 350: 2, 750: 3, 1200: 5 },
}) => {
  const placeholders = Array.from({ length: 12 });
  return (
    <ResponsiveMasonry columnsCountBreakPoints={breakpoint}>
      <Masonry>
        {loading &&
          placeholders.map((_, i) => <ImageCardSkeleton key={i} keyId={i} />)}
        {!loading &&
          items.map((item) => (
            <ImageCard
              key={item.id}
              item={item}
              onClick={onClick}
              actions={actions}
              renderHeader={renderHeader}
              renderFooter={renderFooter}
            />
          ))}
      </Masonry>
    </ResponsiveMasonry>
  );
};

export default MasonryWithSkeleton;

// ================== Skeleton ==================
const ImageCardSkeleton = ({ keyId }: { keyId: number }) => (
  <div className="group animate-fade-up flex w-full flex-col overflow-hidden rounded-xl transition-all duration-300">
    <Skeleton height={keyId % 2 === 0 ? 320 : 200} className="rounded-xl" />
    <div className="flex w-full justify-between p-3">
      <div className="flex items-center gap-2">
        <Skeleton circle width={20} height={20} />
        <Skeleton width={80} height={14} />
      </div>
      <Skeleton width={32} height={32} circle />
    </div>
  </div>
);

// // ================== Example actions ==================
// export const defaultActions: ImageCardAction[] = [
//   {
//     key: "share",
//     label: "Share",
//     icon: <Share2 className="h-4 w-4" />,
//     onClick: (item) => console.log("share", item),
//   },
//   {
//     key: "save",
//     label: "Save",
//     icon: <FolderPlus className="h-4 w-4" />,
//     onClick: (item) => console.log("save", item),
//   },
//   {
//     key: "edit",
//     label: "Edit",
//     icon: <PenLine className="h-4 w-4" />,
//     onClick: (item) => console.log("edit", item),
//   },
//   {
//     key: "download",
//     label: "Download",
//     icon: <Download className="h-4 w-4" />,
//     onClick: (item) => downloadImage(item.url),
//   },
//   {
//     key: "delete",
//     label: "Delete",
//     icon: <Trash2 className="h-4 w-4 text-red-500" />,
//     onClick: (item) => console.log("delete", item),
//     className: "text-red-500",
//   },
// ];
