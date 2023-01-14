import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import styled from 'styled-components'
import SlideUp from '@/transition/SlideUp';
import { omit } from 'lodash';
import useTranslation from 'next-translate/useTranslation';
import { type ReactNode, useState, cloneElement, type ReactElement } from 'react';
import ButtonCloseDialog from '@/components/ButtonCloseDialog/ButtonCloseDialog';
import DialogConfirm from '@/components/DialogConfirm/DialogConfirm';
import { useSession } from 'next-auth/react';
import { trpc } from '@/utils/trpc.utils';
import DialogAddProduct from '@/containers/DialogAddProduct/DialogAddProduct'

const Remove = styled.div`
    display: grid;
    width: calc(100% - 10px);
    padding: 3.75px 5px;
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--theme-background);
    z-index: 2;
    ${this} button{
        background: red;
    }
`

const Close = styled.div`
    display: grid;
    width: calc(100% - 10px);
    padding: 3.75px 5px;
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--theme-background);
    z-index: 2;
`

const Placeholder = styled.div`
    width: 100%;
    height: 88px;
`

const Grid = styled.div`
    width: 100%;
    margin: 0 auto;
    max-width: 702px;
    padding: 12px;
    display: grid;
    min-height: calc(100vh - var(--BothNavHeightAndPadding));
    ${this} {
        min-height: auto;
    }
    @media (max-width: 726px) {
        ${this} {
            width: calc(100% - 24px);
        }
    }
`

const PROPERTIES_TO_OMIT = [
    'id',
    'userId',
    'nameLength',
    'isVerified',
    'isDeleted',
    'isExpectingCheck',
    'createdAt',
    'updatedAt',
]

interface DialogShowProductProps {
    children?: ReactElement
    product: Product
    mealToAdd?: number
    onClose?: () => void
    defaultState?: boolean
}

const DialogShowProduct = ({
    children,
    product,
    mealToAdd = 0,
    onClose,
    defaultState = false,
}: DialogShowProductProps) => {
    const { t } = useTranslation('nutrition-diary')
    const { data: sessionData } = useSession()

    const [isDialog, setIsDialog] = useState(defaultState)

    const handleSetIsDialog = (state: boolean) => {
        if (!state) {
            onClose?.()
        }

        setIsDialog(state)
    }

    const deleteProduct = trpc.product.delete.useMutation({
        onSuccess() {
            handleSetIsDialog(false)
        },
    })

    const isOwner = sessionData?.user?.id == product?.userId

    return (
        <>
            {children && cloneElement(children, { onClick: () => handleSetIsDialog(true) })}
            <Dialog
                fullScreen
                open={isDialog}
                TransitionComponent={SlideUp}
            >
                <Grid>
                    <table style={{ textAlign: 'center' }}>
                        <tbody>
                            {Object.keys(omit(product, PROPERTIES_TO_OMIT)).map(key =>
                                <tr key={key}>
                                    <td key={key}>{key}</td>
                                    <td>{product[key as keyof typeof product] as unknown as ReactNode}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <Placeholder />
                    {isOwner &&
                        <DialogConfirm
                            isDisabled={!isOwner}
                            onConfirmed={async () => await deleteProduct.mutateAsync({ id: product.id })}
                        >
                            <Remove>
                                <Button variant="contained">
                                    {t('Delete')}
                                </Button>
                            </Remove>
                        </DialogConfirm>
                    }
                    <DialogAddProduct product={product}>
                        <Close>
                            <Button variant="contained">
                                {t('ADD_TO_DIARY')}
                            </Button>
                        </Close>
                    </DialogAddProduct>
                    <ButtonCloseDialog clicked={() => handleSetIsDialog(false)} />
                </Grid>
            </Dialog>
        </>
    )
}

export default DialogShowProduct;