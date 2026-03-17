export const templates = {
    basic: `
# {title}

{content}
`,
    invoice: `
# Invoice

**Invoice Number:** {invoiceNumber}
**Date:** {date}

**To:**
{recipient.name}
{recipient.address}

**From:**
{sender.name}
{sender.address}

| Description | Quantity | Price |
| --- | --- | --- |
| {item.description} | {item.quantity} | {item.price} |

**Total:** {total}
`,
};
