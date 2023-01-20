import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import DeleteIcon from '@mui/icons-material/Delete'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { zodResolver } from '@hookform/resolvers/zod'
import useTranslation from 'next-translate/useTranslation'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import BottomFlyingGuestBanner from '@/components/BottomFlyingGuestBanner/BottomFlyingGuestBanner'
import NavbarWorkout from '@/containers/Workout/NavbarWorkout/NavbarWorkout'
import DialogAddExercises from '@/containers/DialogAddExercises/DialogAddExercises'
import InputAdornment from '@mui/material/InputAdornment';
import { useSession } from 'next-auth/react'
import { trpc } from '@/utils/trpc.utils'
import { type WorkoutPlanSchema, workoutPlanSchema } from '@/server/schema/workoutPlan.schema'
import { updateArray } from '@/utils/global.utils'
import styled from 'styled-components'
import Autocomplete from '@mui/material/Autocomplete';
import { range } from 'lodash'
import { CustomTextField } from '@/components/CustomTextField'

const Form = styled.form`
    margin-bottom: 10px;
`

const ExerciseBox = styled.div`
    width: 100%;
    box-sizing: border-box;
    font-size: 14px;
    ${this} > div:nth-child(1) {
        color: #fff;
        background: #90caf9;
        border-radius: 4px;
        padding: 8px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        text-align: center;
        align-items: center;
    }
    ${this} > div:nth-child(2) {
        display: flex;
        width: 100%;
        gap: 8px;
        ${this} > div {
            flex: 1;
        }
    }
`

const SERIES = range(1, 11)
const REPS = range(1, 101)
const RIR = range(0, 6, 0.5)

const WorkoutPlan = () => {
    const router: any = useRouter()
    const { t } = useTranslation('workout')
    const { data: sessionData } = useSession()

    const username = router.query.login || ''
    const id = parseInt(router.query.id || 0)

    const utils = trpc.useContext()

    const {
        data,
        isFetching,
    } = trpc
        .workoutPlan
        .get
        .useQuery({ id, username }, {
            enabled: !!id && !!username,
            onSuccess(data) {
                reset({
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    burnedCalories: data.burnedCalories,
                    exercises: data.exercises,
                })
            },
        })

    const updateWorkoutPlan = trpc.workoutPlan.update.useMutation({
        onSuccess(data) {
            utils
                .workoutPlan
                .get
                .setData({ id, username }, currentData => {
                    if (currentData?.id === id && sessionData?.user) {
                        return {
                            ...data as unknown as WorkoutPlan,
                            user: sessionData.user as unknown as User,
                        }
                    }

                    return currentData
                })

            utils
                .workoutPlan
                .getAll
                .setData({ username }, currentData => updateArray<WorkoutPlan>(currentData, data))
        },
    })

    const deleteWorkoutPlan = trpc.workoutPlan.delete.useMutation({
        onSuccess: () => {
            utils
                .workoutPlan
                .getAll
                .setData({ username }, currentData =>
                    currentData?.filter(workoutPlan => workoutPlan.id !== id)
                )

            router.push(`/${sessionData?.user?.username}/workout/plans`)
        }
    })

    const isLoading = isFetching || updateWorkoutPlan.isLoading || deleteWorkoutPlan.isLoading

    const {
        register,
        formState: { errors },
        handleSubmit,
        control,
        reset,
    } = useForm<WorkoutPlanSchema>({ resolver: zodResolver(workoutPlanSchema) })

    const {
        fields,
        append,
        remove,
        move,
        update,
    } = useFieldArray({ control, name: "exercises", keyName: 'uuid' })

    const handleOnSave = async (newWorkoutPlan: WorkoutPlanSchema) => {
        await updateWorkoutPlan.mutate(newWorkoutPlan)
    }

    const handleOnSaveWithRouter = async (newWorkoutPlan: WorkoutPlanSchema) => {
        await updateWorkoutPlan.mutateAsync(newWorkoutPlan)
            .then(() => router.push(`/${sessionData?.user?.username}/workout/plans`))
    }

    useEffect(() => {
        const handleSubmitProxy = () => handleSubmit(handleOnSave)()

        window.addEventListener('blur', handleSubmitProxy)

        return window.removeEventListener('blur', handleSubmitProxy)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleOnDelete = async () => {
        if (!data?.id) return

        await deleteWorkoutPlan.mutate({ id: data.id })
    }

    const handleOnDragEnd = (result: any) => {
        if (!result.destination) return

        move(result.source.index, result.destination.index)
    }

    const isOwner = sessionData?.user?.id == data?.userId

    return (
        <Form>
            <NavbarWorkout
                isDisabled={isLoading || !data?.id}
                isLoading={isLoading}
                onSave={handleSubmit(handleOnSaveWithRouter)}
                onDelete={handleOnDelete}
                onArrowBack={() => router.push(`/${sessionData?.user?.username}/workout/plans`)}
            />
            <TextField
                focused
                disabled={!isOwner}
                label={t('NAME_OF_WORKOUT')}
                {...register('name')}
                sx={{ width: '100%', marginTop: '10px' }}
                type="text"
                error={typeof errors.name === 'undefined' ? false : true}
                helperText={errors.name?.message}
            />

            <TextField
                variant="outlined"
                label={t("BURNT_CALORIES")}
                type="number"
                focused
                fullWidth
                disabled={!isOwner}
                sx={{ marginTop: '10px' }}
                {...register('burnedCalories')}
                error={!!errors.burnedCalories}
                helperText={errors.burnedCalories?.message}
                InputProps={{
                    endAdornment: <InputAdornment position="end">kcal</InputAdornment>,
                }}
            />

            <TextField
                focused
                multiline
                disabled={!isOwner}
                label={t('DESCRIPTION')}
                type="text"
                {...register('description')}
                sx={{ width: '100%', marginTop: '10px' }}
                error={typeof errors.description === 'undefined' ? false : true}
                helperText={errors.description?.message}
            />

            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="exercises">
                    {(provided: any) => (
                        <Stack direction="column" spacing={1} marginTop="10px" {...provided.droppableProps} ref={provided.innerRef}>
                            {fields.map((exercise, i: number) =>
                                <Draggable key={exercise.id} draggableId={exercise.uuid} index={i} isDragDisabled={!isOwner}>
                                    {(provided: any) => (
                                        <ExerciseBox
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            ref={provided.innerRef}
                                        >
                                            <div>
                                                <SwapVertIcon />
                                                <div>{`${i + 1}. ${exercise.name}`}</div>
                                                <DeleteIcon fontSize='small' onClick={() => remove(i)} />
                                            </div>
                                            <div>
                                                <Autocomplete
                                                    sx={{ marginTop: '8px' }}
                                                    disablePortal
                                                    value={exercise.series || 1}
                                                    options={SERIES}
                                                    onChange={(_, series) => update(i, { ...exercise, series })}
                                                    disableClearable
                                                    disabled={!isOwner}
                                                    getOptionLabel={option => option.toString()}
                                                    renderInput={params => <TextField {...params} label="Series" />}
                                                />
                                                <Autocomplete
                                                    sx={{ marginTop: '8px' }}
                                                    disablePortal
                                                    value={exercise.reps || 1}
                                                    options={REPS}
                                                    onChange={(_, reps) => update(i, { ...exercise, reps })}
                                                    disableClearable
                                                    disabled={!isOwner}
                                                    getOptionLabel={option => option.toString()}
                                                    renderInput={params => <TextField {...params} label="Reps" />}
                                                />
                                                <Autocomplete
                                                    sx={{ marginTop: '8px' }}
                                                    disablePortal
                                                    value={exercise.rir || 1}
                                                    options={RIR}
                                                    onChange={(_, rir) => update(i, { ...exercise, rir })}
                                                    disableClearable
                                                    disabled={!isOwner}
                                                    getOptionLabel={option => option.toString()}
                                                    renderInput={params => <TextField {...params} label="RIR" />}
                                                />
                                            </div>

                                            <CustomTextField
                                                multiline
                                                disabled={!isOwner}
                                                label={t('Notes')}
                                                type="text"
                                                sx={{ width: '100%', marginTop: '8px' }}
                                                defaultValue={exercise.note}
                                                onChange={note => update(i, { ...exercise, note })}
                                            />
                                        </ExerciseBox>
                                    )}
                                </Draggable>
                            )}
                            {provided.placeholder}
                        </Stack>
                    )}
                </Droppable>
            </DragDropContext>
            {data?.userId && isOwner &&
                <DialogAddExercises
                    skipThoseIDS={fields as unknown as WorkoutPlanExercise[]}
                    addThoseExercises={exercises => append(exercises)}
                />
            }
            {data?.userId && !isOwner &&
                <BottomFlyingGuestBanner
                    src={data.user.image}
                    username={data.user.username}
                />
            }
        </Form>
    )
}

export default WorkoutPlan;