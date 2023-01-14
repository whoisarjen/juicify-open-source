import Dialog from '@mui/material/Dialog';
import styled from 'styled-components'
import SlideUp from '@/transition/SlideUp';
import NavbarOnlyTitle from '@/components/NavbarOnlyTitle/NavbarOnlyTitle';
import { useState, ReactNode } from 'react';
import ButtonCloseDialog from '@/components/ButtonCloseDialog/ButtonCloseDialog';
import ButtonPlusIcon from '@/components/ButtonPlusIcon/ButtonPlusIcon';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { grey } from '@mui/material/colors';
import BoxExercise from '@/containers/DialogAddExercises/BoxExercise/BoxExercise';
import DialogCreateExercise from '@/containers/DialogAddExercises/DialogCreateExercise/DialogCreateExercise';
import TabsAddDialog from '@/components/TabsAddDialog/TabsAddDialog';
import ButtonSubmitItems from '@/components/ButtonSubmitItems/ButtonSubmitItems';
import { trpc } from '@/utils/trpc.utils';
import { env } from '@/env/client.mjs';
import { type Exercise } from '@prisma/client';
import CustomAutocomplete from '@/components/CustomAutocomplete/CustomAutocomplete';
import useCache from '@/hooks/useCache'

const DialogContent = styled.div`
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

const ButtonHolder = styled.div`
    margin: auto;
    display: grid;
`

interface DialogAddExercisesProps {
    children?: ReactNode
    skipThoseIDS: (WorkoutPlanExercise | WorkoutResultExercise)[],
    addThoseExercises: (exercises: Exercise[]) => void,
}

const filterCondition = (skipThoseIDS: (WorkoutPlanExercise | WorkoutResultExercise)[]) =>
    (exercise: Exercise) =>
        !skipThoseIDS.some(x => x.id === exercise?.id)

const DialogAddExercises = ({
    children,
    skipThoseIDS = [],
    addThoseExercises,
}: DialogAddExercisesProps) => {
    const [tab, setTab] = useState(0)
    const [isDialog, setIsDialog] = useState(false)
    const [name, setName] = useState('')
    const [checkedBeforeFilter, setChecked] = useCache<Exercise[]>('CHECKED_EXERCISES')

    const enabled = name.length >= env.NEXT_PUBLIC_SEARCH_MIN_NAME_LENGTH && tab === 0

    const {
        data: loadedExercises = [],
        isFetching,
    } = trpc
        .exercise
        .getAll
        .useQuery({ name }, { enabled })

    const checked = checkedBeforeFilter.filter(filterCondition(skipThoseIDS))

    const exercises = tab === 1
        ? checked
        : loadedExercises
            .filter(filterCondition(skipThoseIDS))

    const addExercisesToWorkoutPlan = async () => {
        addThoseExercises(checked)
        setIsDialog(false)
        setName('')
        setChecked([])
    }

    const handleChangeCheckedState = (state: boolean, exercise: Exercise) => {
        if (state) {
            setChecked([...checked, exercise])
        } else {
            setChecked(checked.filter(({ id }) => exercise.id !== id))
        }
    }

    return (
        <>
            <ButtonHolder onClick={() => setIsDialog(true)}>
                {children || <ButtonPlusIcon icon={<FitnessCenterIcon sx={{ color: grey[50] }} />} />}
            </ButtonHolder>

            <Dialog
                fullScreen
                scroll='body'
                open={isDialog}
                TransitionComponent={SlideUp}
            >
                <DialogContent>
                    <NavbarOnlyTitle title="workout:ADD_EXERCISES" />

                    <CustomAutocomplete
                        find={name}
                        setFind={setName}
                        isLoading={isFetching}
                    />

                    <TabsAddDialog
                        changeTab={(value: number) => setTab(value)}
                        checkedLength={checked.length}
                    />

                    {exercises.map(exercise =>
                        <BoxExercise
                            isChecked={checked.some(x => x.id === exercise.id)}
                            onCheck={handleChangeCheckedState}
                            exercise={exercise}
                            key={exercise.id}
                        />
                    )}

                    <DialogCreateExercise
                        onCreated={createdName => createdName == name
                            ? setName('')
                            : setName(createdName)
                        }
                    />

                    <ButtonSubmitItems
                        showNumber={checked.length}
                        clicked={addExercisesToWorkoutPlan}
                    />

                    <ButtonCloseDialog clicked={() => setIsDialog(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}

export default DialogAddExercises;