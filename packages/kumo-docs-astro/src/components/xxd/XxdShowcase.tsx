// 小小东换皮总览：一页看完主要组件在当前外观（主题 / 圆角 / 主色）下的样子。
import type { ReactNode } from "react";
import { ButtonPrimaryDemo, ButtonSecondaryDemo, ButtonGhostDemo, ButtonDestructiveDemo, ButtonOutlineDemo, ButtonSizesDemo, ButtonWithIconDemo, ButtonLoadingDemo } from "../demos/ButtonDemo";
import { InputWithLabelDemo, InputErrorStringDemo } from "../demos/InputDemo";
import { SelectBasicDemo } from "../demos/SelectDemo";
import { SwitchVariantsDemo } from "../demos/SwitchDemo";
import { CheckboxIndeterminateDemo, CheckboxCheckedDemo } from "../demos/CheckboxDemo";
import { RadioDefaultDemo, RadioSegmentedDemo } from "../demos/RadioDemo";
import { TabsDefaultDemo, TabsSegmentedDemo, TabsUnderlineDemo } from "../demos/TabsDemo";
import { BadgeSemanticVariantsDemo, BadgeDotDemo } from "../demos/BadgeDemo";
import { BannerVariantsDemo } from "../demos/BannerDemo";
import { DialogWithActionsDemo } from "../demos/DialogDemo";
import { DropdownBasicDemo } from "../demos/DropdownDemo";
import { TooltipBasicDemo } from "../demos/TooltipDemo";
import { MeterBasicDemo } from "../demos/MeterDemo";
import { EmptyBasicDemo } from "../demos/EmptyDemo";
import { PaginationBasicDemo } from "../demos/PaginationDemo";
import { TableBasicDemo } from "../demos/TableDemo";
import { CollapsibleBasicDemo } from "../demos/CollapsibleDemo";
import { SliderBasicDemo } from "../demos/SliderDemo";
import { LayerCardBasicDemo } from "../demos/LayerCardDemo";
import { LoaderBasicDemo } from "../demos/LoaderDemo";

function Cell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-kumo-line py-5" data-xxd-cell={title}>
      <h2 className="mb-3 text-xs font-medium text-kumo-subtle">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export function XxdShowcase() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Cell title="Button"><ButtonPrimaryDemo /><ButtonSecondaryDemo /><ButtonGhostDemo /><ButtonOutlineDemo /><ButtonDestructiveDemo /><ButtonWithIconDemo /><ButtonLoadingDemo /></Cell>
      <Cell title="Button sizes"><ButtonSizesDemo /></Cell>
      <Cell title="Input"><InputWithLabelDemo /><InputErrorStringDemo /></Cell>
      <Cell title="Select"><SelectBasicDemo /></Cell>
      <Cell title="Switch"><SwitchVariantsDemo /></Cell>
      <Cell title="Checkbox / Radio"><CheckboxCheckedDemo /><CheckboxIndeterminateDemo /><RadioDefaultDemo /></Cell>
      <Cell title="Segmented"><RadioSegmentedDemo /><TabsSegmentedDemo /></Cell>
      <Cell title="Tabs"><TabsDefaultDemo /><TabsUnderlineDemo /></Cell>
      <Cell title="Badge"><BadgeSemanticVariantsDemo /><BadgeDotDemo /></Cell>
      <Cell title="Banner"><BannerVariantsDemo /></Cell>
      <Cell title="Overlay"><DialogWithActionsDemo /><DropdownBasicDemo /><TooltipBasicDemo /></Cell>
      <Cell title="Meter / Slider / Loader"><MeterBasicDemo /><SliderBasicDemo /><LoaderBasicDemo /></Cell>
      <Cell title="Collapsible / Pagination"><CollapsibleBasicDemo /><PaginationBasicDemo /></Cell>
      <Cell title="LayerCard"><LayerCardBasicDemo /></Cell>
      <Cell title="Table"><TableBasicDemo /></Cell>
      <Cell title="Empty"><EmptyBasicDemo /></Cell>
    </div>
  );
}
