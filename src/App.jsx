import React, { useCallback, useEffect, useState } from "react";
import { Description, Label, Radio, RadioGroup } from "@heroui/react";
import clsx from "clsx";
import { GiSprout } from "react-icons/gi";
import { BiSolidZap } from "react-icons/bi";
import { GiLaurelsTrophy } from "react-icons/gi";
import { Avatar } from "@heroui/react";
import { Button, Tooltip, Chip } from "@heroui/react";
import { MdWorkHistory } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import { BsDoorOpenFill } from "react-icons/bs";
import { TbCircleCheckFilled } from "react-icons/tb";

import AuthForm from "./components/AuthForm";
import QuizComponent from "./components/QuizComponent";
import ReviewComponent from "./components/ReviewComponent";
import HistoryList from "./components/HistoryList";
import { fetchCurrentUser, getToken, logout } from "./services/api";

const DIFFICULTY_OPTIONS = [
  {
    value: 1,
    label: "Débutant",
    icon: GiSprout,
    hint: "Les bases du métier",
    description:
      "Découvrez les fondamentaux du management d’artistes, les rôles et les notions essentielles du secteur musical.",
  },
  {
    value: 2,
    label: "Intermédiaire",
    icon: BiSolidZap,
    hint: "Contrats et carrière",
    description:
      "Approfondissez la gestion de carrière, les contrats, les relations professionnelles et le développement des artistes.",
  },
  {
    value: 3,
    label: "Avancé",
    icon: GiLaurelsTrophy,
    hint: "Économie de la musique",
    description:
      "Testez vos connaissances sur l’industrie musicale, son économie, les stratégies de développement et les enjeux du secteur.",
  },
];

export default function App() {
  // "home" | "quiz" | "result" | "history" | "reviewAttempt"
  const [screen, setScreen] = useState("home");
  const [difficulty, setDifficulty] = useState(1);
  const [lastResult, setLastResult] = useState(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);

  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Au chargement : si un jeton est déjà stocké, on le valide auprès de l'API.
  useEffect(() => {
    if (!getToken()) {
      setCheckingSession(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setCheckingSession(false));
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
    setScreen("home");
    setLastResult(null);
    setSelectedAttemptId(null);
  }

  // Un 401 pendant une action (jeton expiré) renvoie proprement à l'écran de
  // connexion. useCallback : la fonction est passée en dépendance de useEffect
  // dans les composants enfants, elle doit rester stable entre deux rendus.
  const handleAuthExpired = useCallback(() => {
    logout();
    setUser(null);
    setScreen("home");
  }, []);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Chargement…
      </div>
    );
  }

  return (
    <div
      className={`relative ${screen === "result" ? "h-auto" : "h-[60rem]"} md:min-h-screen md:h-full ${user ? "bg-[url('https://res.cloudinary.com/tnqx0erv/image/upload/v1789899183/ChatGPT_Image_20_sept._2026_12_12_20.png')] bg-size-[55%] bg-no-repeat bg-bottom-right" : "bg-[url('https://res.cloudinary.com/tnqx0erv/image/upload/v1789896760/ChatGPT_Image_19_sept._2026_23_21_15.webp')] bg-cover bg-center bg-no-repeat"}`}
    >
      <header className="px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between p-3">
          {/* <h1 className="text-lg font-semibold text-amber-400">
            QCM · Management d'artistes
          </h1> */}
          <div></div>
          {user && (
            <div>
              <div className="hidden lg:block absolute right-[8rem] top-[8rem] mt-2 w-20  py-2">
                <div className="liquid-ice p-2.5 px-6">
                  <div className="flex flex-col items-center gap-4 px-4 py-2">
                    <div>
                      <Tooltip delay={0}>
                        <Tooltip.Trigger aria-label="Status chip">
                          <Avatar size="lg">
                            <Avatar.Image
                              alt="Aldianna"
                              src="https://res.cloudinary.com/tnqx0erv/image/upload/v1789989699/ChatGPT_Image_21_sept._2026_13_20_49.png"
                            />
                            <Avatar.Fallback>AD</Avatar.Fallback>
                          </Avatar>
                        </Tooltip.Trigger>
                        <Tooltip.Content className="flex items-center gap-1.5">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-success" />
                          </span>
                          <p>{user.username}</p>
                        </Tooltip.Content>
                      </Tooltip>
                    </div>
                    <div className="flex flex-col gap-2">
                      {screen !== "home" && screen !== "quiz" && (
                        <div>
                          <Tooltip delay={0}>
                            <Button
                              isIconOnly
                              aria-label="More options"
                              onClick={() => setScreen("home")}
                              variant="tertiary"
                            >
                              <FaHome />
                            </Button>
                            <Tooltip.Content showArrow placement="right">
                              <Tooltip.Arrow />
                              <p>Accueil</p>
                            </Tooltip.Content>
                          </Tooltip>
                        </div>
                      )}
                      <div>
                        <Tooltip delay={0}>
                          <Button
                            isIconOnly
                            aria-label="More options"
                            onClick={() => setScreen("history")}
                            variant="tertiary"
                          >
                            <MdWorkHistory />
                          </Button>
                          <Tooltip.Content showArrow placement="right">
                            <Tooltip.Arrow />
                            <p>Historique des travaux</p>
                          </Tooltip.Content>
                        </Tooltip>
                      </div>
                      <div>
                        <Tooltip delay={0}>
                          <Button
                            isIconOnly
                            aria-label="More options"
                            onClick={handleLogout}
                            variant="danger"
                          >
                            <BsDoorOpenFill />
                          </Button>
                          <Tooltip.Content showArrow placement="right">
                            <Tooltip.Arrow />
                            <p> Déconnexion</p>
                          </Tooltip.Content>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:hidden fixed z-20 top-[93%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
                <div className="liquid-ice p-2.5 px-6 rounded-full">
                  <ul className="flex items-center gap-2">
                    {screen !== "home" && screen !== "quiz" && (
                      <li>
                        <Button
                          isIconOnly
                          aria-label="More options"
                          onClick={() => setScreen("home")}
                          variant="tertiary"
                        >
                          <FaHome />
                        </Button>
                      </li>
                    )}
                    <li>
                      <Button
                        isIconOnly
                        aria-label="More options"
                        onClick={() => setScreen("history")}
                        variant="tertiary"
                      >
                        <MdWorkHistory />
                      </Button>
                    </li>
                    <li>
                      <Button
                        isIconOnly
                        aria-label="More options"
                        onClick={handleLogout}
                        variant="danger"
                      >
                        <BsDoorOpenFill />
                      </Button>
                    </li>
                  </ul>
                </div>
                <div>
                  <Avatar size="lg">
                    <Avatar.Image
                      alt="Aldianna"
                      src="https://res.cloudinary.com/tnqx0erv/image/upload/v1789989699/ChatGPT_Image_21_sept._2026_13_20_49.png"
                    />
                    <Avatar.Fallback>AD</Avatar.Fallback>
                  </Avatar>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        {!user && <AuthForm onAuthenticated={setUser} />}

        {user && screen === "home" && (
          <div className="mx-auto max-w-2xl px-4 py-10">
            <h2 className="archivo-black-regular text-4xl">
              Bienvenue sur QCM · Management d'artistes
            </h2>
            <fieldset className="mt-4 mb-10">
              {/* <legend className="mb-6 text-base">Choisissez un niveau</legend> */}
              <RadioGroup
                value={String(difficulty)}
                onChange={(value) => setDifficulty(Number(value))}
                name="difficulty"
                variant="secondary"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Label>Choisissez un niveau</Label>
                </div>
                <div className="grid gap-x-4 md:grid-cols-2">
                  {DIFFICULTY_OPTIONS.map((option) => {
                    const Icon = option.icon;

                    return (
                      <Radio key={option.value} value={String(option.value)}>
                        <Radio.Content
                          className={clsx(
                            "group relative flex w-full flex-row items-start justify-start gap-4 liquid-ice rounded-xl border border-transparent bg-surface px-5 py-4 transition-all",
                            "data-[selected=true]:border-accent data-[selected=true]:bg-accent/10",
                          )}
                        >
                          <Radio.Control className="absolute end-4 top-3 size-5">
                            <Radio.Indicator />
                          </Radio.Control>

                          <Icon
                            className={`size-12 ${
                              option.label === "Avancé"
                                ? "text-red-500"
                                : option.label === "Intermédiaire"
                                  ? "text-amber-500"
                                  : "text-green-500"
                            }`}
                          />

                          <div className="flex flex-col gap-1">
                            <span>{option.label}</span>

                            <Description className="font-semibold">
                              {option.hint}
                            </Description>

                            <Description className="font-normal">
                              {option.description}
                            </Description>
                          </div>
                        </Radio.Content>
                      </Radio>
                    );
                  })}
                </div>
              </RadioGroup>
            </fieldset>

            <div className="flex gap-3">
              <button
                onClick={() => setScreen("quiz")}
                className="cursor-pointer rounded-lg bg-amber-500 px-6 py-3 font-medium text-zinc-950 hover:bg-amber-400"
              >
                Démarrer le QCM
              </button>
              {/* <button
                onClick={() => setScreen("history")}
                className="flex-1 rounded-lg border border-zinc-700 px-6 py-3 font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Voir mon historique
              </button> */}
            </div>
          </div>
        )}

        {user && screen === "quiz" && (
          <QuizComponent
            difficulty={difficulty}
            questionCount={10}
            onCancel={() => setScreen("home")}
            onAuthExpired={handleAuthExpired}
            onFinished={(result) => {
              setLastResult(result);
              setScreen("result");
            }}
          />
        )}

        {user && screen === "result" && lastResult && (
          <ReviewComponent
            result={lastResult}
            onBack={() => setScreen("home")}
          />
        )}

        {user && screen === "history" && (
          <div className="mx-auto max-w-2xl px-4 py-8">
            <h2 className="mb-4 text-lg font-semibold">Mes tentatives</h2>
            <HistoryList
              onAuthExpired={handleAuthExpired}
              onSelectAttempt={(attemptId) => {
                setSelectedAttemptId(attemptId);
                setScreen("reviewAttempt");
              }}
            />
          </div>
        )}

        {user && screen === "reviewAttempt" && (
          <ReviewComponent
            attemptId={selectedAttemptId}
            backLabel="Retour à l'historique"
            onBack={() => setScreen("history")}
          />
        )}
      </main>
    </div>
  );
}
