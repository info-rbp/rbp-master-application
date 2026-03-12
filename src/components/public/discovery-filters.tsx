import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type OptionGroups = {
  categories: string[];
  tags: string[];
  contentTypes: string[];
  tiers: string[];
};

export function DiscoveryFilters({
  action,
  values,
  options,
}: {
  action: string;
  values: Record<string, string | undefined>;
  options: OptionGroups;
}) {
  const selectClass = 'h-9 rounded-md border bg-background px-3 text-sm';

  return (
    <form action={action} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-6 md:items-end">
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-medium">Keyword</label>
        <Input name="keyword" defaultValue={values.keyword ?? ''} placeholder="Search title, summary, tags" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Content type</label>
        <select name="contentType" defaultValue={values.contentType ?? 'all'} className={selectClass}>
          <option value="all">All</option>
          {options.contentTypes.map((type) => (
            <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Category</label>
        <select name="category" defaultValue={values.category ?? 'all'} className={selectClass}>
          <option value="all">All</option>
          {options.categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Tag</label>
        <select name="tag" defaultValue={values.tag ?? 'all'} className={selectClass}>
          <option value="all">All</option>
          {options.tags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Tier</label>
        <select name="tier" defaultValue={values.tier ?? 'all'} className={selectClass}>
          <option value="all">All</option>
          {options.tiers.map((tier) => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-6 flex gap-2">
        <Button type="submit">Apply filters</Button>
        <Button type="button" variant="outline" asChild><a href={action}>Reset</a></Button>
      </div>
    </form>
  );
}
