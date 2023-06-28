// @ts-nocheck
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import { useRouter } from 'next/router'
import SidebarRight from 'src/layout/SidebarRight'
import { useEffect, useState } from 'react'
import { env } from '@/env/client.mjs'

const PostPage = () => {
    const router = useRouter()
    const slug = router.query.slug as string
    const postId = slug.substring(slug.lastIndexOf('-') + 1, slug.length)
    const [post, setPost] = useState(null)

    useEffect(() => {
        (async () => {
            await fetch(`${env.NEXT_PUBLIC_STRAPI_URL}/api/posts/${postId}?populate=*`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${env.NEXT_PUBLIC_API_TOKEN}`,
                },
            })
                .then(async (res) => await res.json())
                .then(res => setPost(res))
        })()
    }, [postId])

    if (!post) {
        return null
    }

    return (
        <div className="flex flex-1 flex-col gap-8">
            <Image
                src={`${post.data.attributes.thumbnail
                    ? `${env.NEXT_PUBLIC_STRAPI_URL}${post.data.attributes.thumbnail.data?.attributes.formats.large.url}`
                    : `${env.NEXT_PUBLIC_NEXTAUTH_URL}/images/logo.png`
                }`}
                alt="Juicify"
                width={post.data.attributes.thumbnail.data?.attributes.formats.large.width || 1000}
                height={post.data.attributes.thumbnail.data?.attributes.formats.large.height || 667}
                className="mx-auto"
            />
            <div className="flex gap-8 flex-row">
                <div className="flex flex-1 flex-col gap-3 prose dark:prose-invert">
                    <h1>{post.data.attributes.title}</h1>
                    <ReactMarkdown>{post.data.attributes.content}</ReactMarkdown>
                </div>
                <div className="flex">
                    <SidebarRight />
                </div>
            </div>
        </div>
    )
}

export default PostPage
