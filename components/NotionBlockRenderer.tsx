
import React from 'react'

/**
 * Renders a single Notion block.
 * This component is designed to be used client-side or server-side.
 * If used client-side, ensure no sensitive data is passed in the block prop.
 */
const renderContent = (text: string) => {
    const trimmed = text.trim();
    // Check for image URL
    if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(trimmed)) {
        return (
            <img
                src={trimmed}
                alt="Embedded content"
                className="my-4 rounded-lg border border-white/10 max-w-full h-auto"
                loading="lazy"
            />
        );
    }
    // Check for web URL
    if (/^https?:\/\//i.test(trimmed)) {
        return (
            <a
                href={trimmed}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline break-all"
            >
                {trimmed}
            </a>
        );
    }
    // Plain text
    return text;
};

export function NotionBlockRenderer({ block }: { block: any }) {
    const type = block.type

    switch (type) {

        case 'paragraph': {
            const textContent = block.paragraph?.rich_text?.map((text: any) => text.plain_text).join('') || '';
            return (
                <div key={block.id} className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {renderContent(textContent)}
                </div>
            )
        }

        case 'heading_1':
            return (
                <h2 key={block.id} className="mt-8 mb-4 text-3xl font-bold" style={{ color: 'var(--heading-primary)' }}>
                    {block.heading_1?.rich_text?.map((text: any) => text.plain_text).join('')}
                </h2>
            )

        case 'heading_2':
            return (
                <h3 key={block.id} className="mt-6 mb-3 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                    {block.heading_2?.rich_text?.map((text: any) => text.plain_text).join('')}
                </h3>
            )

        case 'heading_3':
            return (
                <h4 key={block.id} className="mt-5 mb-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                    {block.heading_3?.rich_text?.map((text: any) => text.plain_text).join('')}
                </h4>
            )

        case 'bulleted_list_item': {
            const bulletText = block.bulleted_list_item?.rich_text?.map((text: any) => text.plain_text).join('') || '';
            return (
                <li key={block.id} className="ml-6 list-disc mb-1" style={{ color: 'var(--muted-foreground)' }}>
                    {renderContent(bulletText)}
                </li>
            )
        }

        case 'numbered_list_item': {
            const numText = block.numbered_list_item?.rich_text?.map((text: any) => text.plain_text).join('') || '';
            return (
                <li key={block.id} className="ml-6 list-decimal mb-1" style={{ color: 'var(--muted-foreground)' }}>
                    {renderContent(numText)}
                </li>
            )
        }

        case 'embed': {
            const url = block.embed?.url || '';
            return (
                <div key={block.id} className="my-4">
                    {renderContent(url)}
                </div>
            )
        }

        case 'image':
            const imageUrl = block.image?.external?.url || block.image?.file?.url
            return (
                imageUrl && (
                    <img
                        key={block.id}
                        src={imageUrl}
                        alt="Content image"
                        className="my-6 rounded-lg max-w-full h-auto transition-colors duration-500"
                        style={{ borderColor: 'var(--border)' }}
                        loading="lazy"
                    />
                )
            )

        case 'code':
            return (
                <pre key={block.id} className="overflow-x-auto rounded-lg p-4 text-sm my-4"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                    <code className="font-mono" style={{ color: 'var(--foreground)' }}>
                        {block.code?.rich_text?.map((text: any) => text.plain_text).join('')}
                    </code>
                </pre>
            )

        case 'quote':
            return (
                <blockquote
                    key={block.id}
                    className="border-l-4 pl-4 italic my-4 py-2 pr-2 rounded-r transition-colors duration-500"
                    style={{
                        borderLeftColor: 'var(--primary)',
                        backgroundColor: 'var(--sidebar-bg)',
                        color: 'var(--muted-foreground)'
                    }}
                >
                    {block.quote?.rich_text?.map((text: any) => text.plain_text).join('')}
                </blockquote>
            )

        case 'divider':
            return <hr key={block.id} className="my-8 transition-colors duration-500" style={{ borderColor: 'var(--border)' }} />

        default:
            return null
    }
}
